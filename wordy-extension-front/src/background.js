{
   const AUTH_TOKEN_KEY = 'auth-token';
   const USER_KEY = 'user';
   const LANG_KEY = 'lang';
   const URLS_KEY = 'urls';
   const FEEDBACK_DATA_KEY = 'feedback-data';

   const localizeData = {
      allowedLangs: ['en', 'es', 'uk', 'pl'],
      defaultLang: 'pl'
   };

   const useApi = () => {
      const API_URL = 'https://impyouridea.uk/api/v1';

      const getHeaders = token => {
         const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
         };

         if (token) {
            headers['Authorization'] = `Bearer ${token}`;
         }

         return headers;
      };

      const formattingResponse = async response => {
         const text = await response.text();

         if (text) {
            const data = JSON.parse(text);

            if (data?.error) {
               if (data.error === 'token is expired') {
                  sendChromeMessage('token-is-expired');
                  return null;
               } else {
                  throw new Error(data.error);
               }
            }

            return data;
         } else {
            return null;
         }
      };

      const get = async (path, token = null) => {
         const response = await fetch(`${API_URL}${path}`, {
            method: 'GET',
            headers: getHeaders(token)
         });

         return formattingResponse(response);
      };

      const post = async (path, body = {}, token = null) => {
         const response = await fetch(`${API_URL}${path}`, {
            method: 'POST',
            headers: getHeaders(token),
            body: JSON.stringify(body)
         });

         return formattingResponse(response);
      };

      const put = async (path, body = {}, token = null) => {
         const response = await fetch(`${API_URL}${path}`, {
            method: 'PUT',
            headers: getHeaders(token),
            body: JSON.stringify(body)
         });

         return formattingResponse(response);
      };

      const del = async (path, token = null) => {
         const response = await fetch(`${API_URL}${path}`, {
            method: 'DELETE',
            headers: getHeaders(token)
         });

         return formattingResponse(response);
      };

      return {get, post, put, del};
   };

   const useStorage = () => {
      const set = async (key, value) => {
         return await new Promise((resolve, reject) => {
            try {
               chrome.storage.local.set({[key]: value}, () => {
                  resolve(value);
               });
            } catch (e) {
               reject(e);
            }
         });
      };

      const get = async key => {
         return await new Promise((resolve, reject) => {
            try {
               chrome.storage.local.get([key], result => {
                  resolve(result[key]);
               });
            } catch (e) {
               reject(e);
            }
         });
      };

      const remove = async key => {
         return await new Promise((resolve, reject) => {
            try {
               chrome.storage.local.remove([key], () => {
                  resolve(true);
               });
            } catch (e) {
               reject(e);
            }
         });
      };

      const clear = async () => {
         return await new Promise((resolve, reject) => {
            try {
               chrome.storage.local.clear(() => {
                  resolve(true);
               });
            } catch (e) {
               reject(e);
            }
         });
      };

      return {set, get, remove, clear};
   };

   const api = useApi();
   const storage = useStorage();

   async function loginWithEmail(email, password) {
      return api.post('/auth/login', {email, password});
   }

   async function loginWithProvider(accessToken) {
      return api.post('/auth/provider/login', {
         provider: 'google',
         accessToken
      });
   }

   async function logout(authToken) {
      return api.post('/auth/logout', {}, authToken);
   }

   async function updateCurrentUser(body) {
      const authToken = await getAuthTokenFromStorage();
      return api.put('/users', body, authToken);
   }

   async function getCurrentUser() {
      const authToken = await getAuthTokenFromStorage();
      return api.get('/users', authToken);
   }

   async function getUrlsByDomain(domain) {
      const authToken = await getAuthTokenFromStorage();
      return api.get(`/urls?page=1&count=1000000&domain=${domain}`, authToken);
   }

   async function addUrl(domain, url, from, to) {
      const authToken = await getAuthTokenFromStorage();
      return api.post('/urls', {domain, url, from, to}, authToken);
   }

   async function deleteUrl(urlId) {
      const authToken = await getAuthTokenFromStorage();
      return api.del(`/urls/${urlId}`, authToken);
   }

   async function toggleUrl(urlId, enabled) {
      const authToken = await getAuthTokenFromStorage();
      return api.put(`/urls/toggle/${urlId}`, {enabled}, authToken);
   }

   async function getAuthTokenFromStorage() {
      return storage.get(AUTH_TOKEN_KEY);
   }

   async function setAuthTokenInStorage(token) {
      return storage.set(AUTH_TOKEN_KEY, token);
   }

   async function getUserFromStorage() {
      const result = await storage.get(USER_KEY);

      if (result) {
         const user = JSON.parse(result);

         if (isObject(user)) {
            return user;
         }
      }

      return null;
   }

   async function setUserInStorage(user) {
      await storage.set(USER_KEY, JSON.stringify(user));
   }

   async function getLangFromStorage() {
      return storage.get(LANG_KEY);
   }

   async function setLangInStorage(lang) {
      await storage.set(LANG_KEY, lang);
   }

   async function getUrlsFromStorage() {
      const result = await storage.get(URLS_KEY);

      if (result) {
         const urls = JSON.parse(result);

         if (isObject(urls)) {
            return urls;
         }
      }

      return {};
   }

   async function setUrlsInStorage(urls) {
      await storage.set(URLS_KEY, JSON.stringify(urls));
   }

   async function getFeedbackDataFromStorage() {
      const result = await storage.get(FEEDBACK_DATA_KEY);

      if (result) {
         const feedbackData = JSON.parse(result);

         if (isObject(feedbackData)) {
            return feedbackData;
         }
      }

      return null;
   }

   async function setFeedbackDataInStorage(feedbackData) {
      await storage.set(FEEDBACK_DATA_KEY, JSON.stringify(feedbackData));
   }

   async function destroyFeedbackDataInStorage() {
      await storage.remove(FEEDBACK_DATA_KEY);
   }

   async function setUserDataInStorage(user) {
      if (!user || !user.token) {
         throw new Error('Invalid argument!');
      }

      if (user.urls) {
         delete user.urls;
      }

      await setAuthTokenInStorage(user.token);
      await setUserInStorage(user);
   }

   async function googleLogin() {
      const redirectUrl = await new Promise((resolve, reject) => {
         try {
            const redirectURL = chrome.identity.getRedirectURL();
            const clientId = '440654159673-u9hvg941vk1jmc60rvlgbegcpa2e60lh.apps.googleusercontent.com';
            const scopes = ['openid', 'email', 'profile'];
            let authUrl = `https://accounts.google.com/o/oauth2/auth`;
            authUrl += `?client_id=${clientId}`;
            authUrl += '&response_type=token';
            authUrl += `&redirect_uri=${encodeURIComponent(redirectURL)}`;
            authUrl += `&scope=${encodeURIComponent(scopes.join(' '))}`;

            chrome.identity.launchWebAuthFlow({
               url: authUrl,
               interactive: true
            }, resolve);
         } catch (e) {
            reject(e);
         }
      });

      return extractAccessToken(redirectUrl);
   }

   async function googleLogout() {
      return await new Promise((resolve, reject) => {
         try {
            chrome.identity.clearAllCachedAuthTokens(resolve);
         } catch (e) {
            reject(e);
         }
      });
   }

   function extractAccessToken(redirectUrl) {
      try {
         if (!redirectUrl) {
            return null;
         }

         const matches = redirectUrl.match(/[#?](.*)/);
         if (!matches || matches.length < 1) {
            return null;
         }

         const params = new URLSearchParams(matches[1].split('#')[0]);
         return params.get('access_token');
      } catch (e) {
         console.error(e);
         return null;
      }
   }

   async function isUserSubscriptionActive() {
      try {
         const user = await getUserFromStorage();
         if (!user || !user.subscription || !user.subscription.nextPaymentDate) {
            return false;
         }

         const nextPaymentDate = new Date(user.subscription.nextPaymentDate);
         if (isNaN(nextPaymentDate)) {
            return false;
         }

         const currentDate = new Date();
         return currentDate.getTime() <= nextPaymentDate.getTime();
      } catch (e) {
         console.error(e);
         return false;
      }
   }

   async function findLibraryUrl(url, from, to, completeMatch) {
      const urlsLibrary = await loadUrlsByDomain(url, from, to);

      for (const item of urlsLibrary) {
         if (url === item.url) {
            return item;
         }
      }

      if (!completeMatch) {
         for (const item of urlsLibrary) {
            if (url.includes(item.url)) {
               return item;
            }
         }
      }

      return null;
   }

   async function loadUrlsByDomain(url, from = null, to = null, hardInit = false) {
      const urls = await getUrlsFromStorage();
      const domain = getDomain(url);

      let result = [];

      if (urls && urls[domain] && urls[domain].initialized && Array.isArray(urls[domain].urls) && !hardInit) {
         result = urls[domain].urls;
      } else {
         const response = await getUrlsByDomain(domain);
         if (response && response.items && Array.isArray(response.items)) {
            urls[domain] = {
               urls: response.items,
               initialized: true
            };

            await setUrlsInStorage(urls);

            result = response.items;
         }
      }

      const filteredUrls = from && to ? result.filter(el => el.from === from && el.to === to) : result;

      return filteredUrls.sort((a, b) => {
         return a.url.length < b.url.length ? 1 : -1;
      });
   }

   async function addToUrls(urlsLibraryItem) {
      const urls = await getUrlsFromStorage();
      urls[urlsLibraryItem.domain].urls.push(urlsLibraryItem);
      await setUrlsInStorage(urls);
   }

   async function deleteFromUrls(urlLibraryItemId, domain) {
      const urls = await getUrlsFromStorage();
      const idx = urls[domain].urls.findIndex(el => el.id === urlLibraryItemId);
      if (idx !== -1) {
         urls[domain].urls.splice(idx, 1);
      }
      await setUrlsInStorage(urls);
   }

   async function updateUrlsLibraryItem(urlsLibraryItem) {
      try {
         const urls = await getUrlsFromStorage();
         const idx = urls[urlsLibraryItem.domain].urls.findIndex(el => el.id === urlsLibraryItem.id);
         if (idx !== -1) {
            urls[urlsLibraryItem.domain].urls[idx] = urlsLibraryItem;
         }
         await setUrlsInStorage(urls);
      } catch (e) {
         console.error(e);
         throw new Error(e);
      }
   }

   async function getAcceptLanguages() {
      return await new Promise(resolve => {
         try {
            chrome.i18n.getAcceptLanguages(resolve);
         } catch (e) {
            console.error(e);
            resolve([]);
         }
      });
   }

   async function getInterfaceLang() {
      const {defaultLang} = localizeData;

      try {
         const lang = await getLangFromStorage();

         if (lang && localizeData.allowedLangs.includes(lang)) {
            return lang;
         }

         const acceptLanguages = await getAcceptLanguages();

         for (let lang of acceptLanguages) {
            const browserLang = localizeData.allowedLangs.find(el => lang.includes(el));

            if (browserLang) {
               await setLangInStorage(browserLang);
               return browserLang;
            }
         }

         await setLangInStorage(defaultLang);
         return defaultLang;
      } catch (e) {
         console.error(e);
         await setLangInStorage(defaultLang);
         return defaultLang;
      }
   }

   async function changeInterfaceLang(lang) {
      const currentLang = await getInterfaceLang();

      if (!localizeData.allowedLangs.includes(lang)) {
         return currentLang;
      }

      if (currentLang === lang) {
         return currentLang;
      }

      await setLangInStorage(lang);

      return lang;
   }

   function isObject(obj) {
      return typeof obj === 'object' && !Array.isArray(obj) && obj !== null;
   }

   function getDomain(url) {
      const w3 = 'www.';

      let {hostname} = new URL(url);
      let formattedDomain = hostname;

      const match = hostname.match(/\./g);

      if (hostname.startsWith(w3) && match && match.length > 1) {
         formattedDomain = hostname.replace(w3, '');
      }

      return formattingDomain(formattedDomain);
   }

   function formattingDomain(domain) {
      return domain.trim().toLowerCase();
   }

   function getRandomValue(t = 20) {
      return crypto.getRandomValues(new Uint8Array(t)).reduce(((t, e) => t += (e &= 63) < 36 ? e.toString(36) : e < 62 ? (e - 26).toString(36).toUpperCase() : e > 62 ? '-' : '_'), '');
   }

   function successMessageResponse(data = null, message = null) {
      return {
         status: 'success',
         data,
         message
      };
   }

   function errorMessageResponse(message, error = null) {
      return {
         status: 'error',
         error,
         message
      };
   }

   chrome.runtime.onMessage.addListener((req, sender, res) => {
      if (req.type === 'login-with-email') {
         new Promise(async resolve => {
            try {
               const {email, password} = req.data;

               const response = await loginWithEmail(email, password);
               await setUserDataInStorage({...response.user, token: response.token});
               resolve(successMessageResponse(null, 'The user has successfully logged in'));
            } catch (e) {
               resolve(errorMessageResponse(e.message));
            }
         }).then(res);

         return true;
      }
   });

   chrome.runtime.onMessage.addListener((req, sender, res) => {
      if (req.type === 'login-with-google') {
         new Promise(async resolve => {
            try {
               const accessToken = await googleLogin();

               if (accessToken) {
                  const data = await loginWithProvider(accessToken);
                  await setUserDataInStorage({...data.user, token: data.token});
                  resolve(successMessageResponse());
               } else {
                  resolve(errorMessageResponse('Failed to get access token from google!'));
               }
            } catch (e) {
               console.error(e);
               resolve(errorMessageResponse(e.message));
            }
         }).then(res);

         return true;
      }
   });

   chrome.runtime.onMessage.addListener((req, sender, res) => {
      if (req.type === 'logout') {
         new Promise(async resolve => {
            try {
               const lang = await getLangFromStorage();
               const authToken = await getAuthTokenFromStorage();

               await storage.clear();

               if (lang) {
                  await setLangInStorage(lang);
               }

               logout(authToken);
               googleLogout();

               resolve(successMessageResponse(null, 'User successfully logged out'));
            } catch (e) {
               resolve(errorMessageResponse(e.message));
            }
         }).then(res);

         return true;
      }
   });

   chrome.runtime.onMessage.addListener((req, sender, res) => {
      if (req.type === 'update-current-user') {
         new Promise(async resolve => {
            try {
               const authToken = await getAuthTokenFromStorage();
               const response = await updateCurrentUser(req.data);

               const user = {
                  ...response,
                  token: authToken
               };

               await setUserDataInStorage(user);
               resolve(successMessageResponse(user));
            } catch (e) {
               console.error(e);
               resolve(errorMessageResponse(e.message));
            }
         }).then(res);

         return true;
      }
   });

   chrome.runtime.onMessage.addListener((req, sender, res) => {
      if (req.type === 'populate') {
         new Promise(async resolve => {
            try {
               const {ignoreNoTokenError} = req.data;

               const authToken = await getAuthTokenFromStorage();

               if (!authToken && ignoreNoTokenError) {
                  resolve(successMessageResponse(null));
               } else {
                  const response = await getCurrentUser();

                  const user = {
                     ...response,
                     token: authToken
                  };

                  await setUserDataInStorage(user);
                  resolve(successMessageResponse(user));
               }
            } catch (e) {
               console.error(e);
               resolve(errorMessageResponse(e.message));
            }
         }).then(res);

         return true;
      }
   });

   chrome.runtime.onMessage.addListener((req, sender, res) => {
      if (req.type === 'get-storage-user') {
         new Promise(async resolve => {
            try {
               const user = await getUserFromStorage();
               resolve(successMessageResponse(user));
            } catch (e) {
               console.error(e);
               resolve(errorMessageResponse(e.message));
            }
         }).then(res);

         return true;
      }
   });

   chrome.runtime.onMessage.addListener((req, sender, res) => {
      if (req.type === 'get-storage-lang') {
         new Promise(async resolve => {
            try {
               const lang = await getLangFromStorage();
               resolve({status: 'success', data: lang});
            } catch (e) {
               console.error(e);
               resolve({status: 'error', message: e.message});
            }
         }).then(res);

         return true;
      }
   });

   chrome.runtime.onMessage.addListener((req, sender, res) => {
      if (req.type === 'set-storage-lang') {
         new Promise(async resolve => {
            try {
               await setLangInStorage(req.lang);
               resolve({status: 'success', message: 'The language was successfully changed.'});
            } catch (e) {
               console.error(e);
               resolve({status: 'error', message: e.message});
            }
         }).then(res);

         return true;
      }
   });

   chrome.runtime.onMessage.addListener((req, sender, res) => {
      if (req.type === 'get-interface-lang') {
         new Promise(async resolve => {
            try {
               const lang = await getInterfaceLang();
               resolve(successMessageResponse(lang));
            } catch (e) {
               console.error(e);
               resolve(errorMessageResponse(e.message));
            }
         }).then(res);

         return true;
      }
   });

   chrome.runtime.onMessage.addListener((req, sender, res) => {
      if (req.type === 'change-interface-lang') {
         new Promise(async resolve => {
            try {
               const {lang} = req.data;
               const currentLang = await changeInterfaceLang(lang);
               resolve(successMessageResponse(currentLang));
            } catch (e) {
               console.error(e);
               resolve(errorMessageResponse(e.message));
            }
         }).then(res);

         return true;
      }
   });

   chrome.runtime.onMessage.addListener((req, sender, res) => {
      if (req.type === 'get-interface-languages') {
         new Promise(async resolve => {
            try {
               resolve(successMessageResponse(localizeData.allowedLangs));
            } catch (e) {
               console.error(e);
               resolve(errorMessageResponse(e.message));
            }
         }).then(res);

         return true;
      }
   });

   chrome.runtime.onMessage.addListener((req, sender, res) => {
      if (req.type === 'add-to-urls-library') {
         new Promise(async resolve => {
            try {
               const {domain, url, from, to} = req.data;
               const formattedUrl = url && typeof url === 'string' ? url.trim() : null;

               if (!domain || !formattedUrl) {
                  throw new Error('URLs library params is invalid!');
               }

               const response = await addUrl(domain, formattedUrl, from, to);
               await addToUrls(response);

               resolve(successMessageResponse(response));
            } catch (e) {
               console.error(e);
               resolve(errorMessageResponse(e.message));
            }
         }).then(res);

         return true;
      }
   });

   chrome.runtime.onMessage.addListener((req, sender, res) => {
      if (req.type === 'toggle-urls-library-item') {
         new Promise(async resolve => {
            try {
               const {id, domain, enabled} = req.data;

               if (!id || !domain || typeof enabled !== 'boolean') {
                  throw new Error('URLs library params is invalid!');
               }

               const response = await toggleUrl(id, enabled);
               await updateUrlsLibraryItem(response);

               resolve(successMessageResponse());
            } catch (e) {
               console.error(e);
               resolve(errorMessageResponse(e.message));
            }
         }).then(res);

         return true;
      }
   });

   chrome.runtime.onMessage.addListener((req, sender, res) => {
      if (req.type === 'remove-from-urls-library') {
         new Promise(async resolve => {
            try {
               const {id, domain} = req.data;

               if (!id || !domain) {
                  throw new Error('URLs library params is invalid!');
               }

               await deleteUrl(id);
               await deleteFromUrls(id, domain);

               resolve(successMessageResponse());
            } catch (e) {
               console.error(e);
               resolve(errorMessageResponse(e.message));
            }
         }).then(res);

         return true;
      }
   });

   chrome.runtime.onMessage.addListener((req, sender, res) => {
      if (req.type === 'get-urls-library-item') {
         new Promise(async resolve => {
            try {
               const {fullUrl, from, to, completeMatch} = req.data;
               const urlLibraryItem = await findLibraryUrl(fullUrl, from, to, completeMatch);
               resolve(successMessageResponse(urlLibraryItem || null));
            } catch (e) {
               console.error(e);
               resolve(errorMessageResponse(e.message));
            }
         }).then(res);

         return true;
      }
   });

   chrome.runtime.onMessage.addListener((req, sender, res) => {
      if (req.type === 'get-urls-library-items-by-domain') {
         new Promise(async resolve => {
            try {
               const {fullUrl, from, to} = req.data;
               const response = await loadUrlsByDomain(fullUrl, from, to);
               resolve(successMessageResponse(response || null));
            } catch (e) {
               console.error(e);
               resolve(errorMessageResponse(e.message));
            }
         }).then(res);

         return true;
      }
   });

   chrome.runtime.onMessage.addListener((req, sender, res) => {
      if (req.type === 'init-urls-library') {
         new Promise(async resolve => {
            try {
               const user = await getUserFromStorage();

               if (user) {
                  const {fullUrl} = req.data;
                  const response = await loadUrlsByDomain(fullUrl, undefined, undefined, true);
                  resolve(successMessageResponse(response || null));
               } else {
                  resolve(successMessageResponse(null));
               }
            } catch (e) {
               console.error(e);
               resolve(errorMessageResponse(e.message));
            }
         }).then(res);

         return true;
      }
   });

   chrome.runtime.onMessage.addListener((req, sender, res) => {
      if (req.type === 'init-feedback-data') {
         new Promise(async resolve => {
            try {
               const {url, lang} = req.data;

               if (!url || !lang) {
                  throw new Error('Invalid params!');
               }

               const feedbackData = {
                  id: getRandomValue(),
                  date: Date.now(),
                  type: 'invalid-lang',
                  url,
                  lang
               };

               await setFeedbackDataInStorage(feedbackData);

               resolve(successMessageResponse(feedbackData));
            } catch (e) {
               console.error(e);
               resolve(errorMessageResponse(e.message));
            }
         }).then(res);

         return true;
      }
   });

   chrome.runtime.onMessage.addListener((req, sender, res) => {
      if (req.type === 'get-feedback-data') {
         new Promise(async resolve => {
            try {
               const feedbackData = await getFeedbackDataFromStorage();
               resolve(successMessageResponse(feedbackData));
            } catch (e) {
               console.error(e);
               resolve(errorMessageResponse(e.message));
            }
         }).then(res);

         return true;
      }
   });

   chrome.runtime.onMessage.addListener((req, sender, res) => {
      if (req.type === 'destroy-feedback-data') {
         new Promise(async resolve => {
            try {
               const {feedbackDataId} = req.data;

               if (!feedbackDataId) {
                  throw new Error('Invalid params!');
               }

               const feedbackData = await getFeedbackDataFromStorage();

               if (feedbackDataId !== feedbackData.id) {
                  throw new Error('Invalid feedback data id!');
               }

               await destroyFeedbackDataInStorage();

               resolve(successMessageResponse());
            } catch (e) {
               console.error(e);
               resolve(errorMessageResponse(e.message));
            }
         }).then(res);

         return true;
      }
   });

   chrome.runtime.onMessage.addListener((req, sender, res) => {
      if (req.type === 'is-user-subscription-active') {
         new Promise(async resolve => {
            try {
               const isActive = await isUserSubscriptionActive();
               resolve(successMessageResponse(isActive));
            } catch (e) {
               console.error(e);
               resolve(errorMessageResponse(e.message));
            }
         }).then(res);

         return true;
      }
   });

   async function sendChromeMessage(type, data = null) {
      return await new Promise((resolve, reject) => {
         try {
            chrome.runtime.sendMessage({type, data}, response => {
               try {
                  if (response?.status) {
                     if (response.status === 'success') {
                        resolve(response.data);
                     } else if (response.status === 'error') {
                        reject(response.message);
                     } else {
                        reject('Unknown status!');
                     }
                  }
               } catch (e) {
                  reject(e);
               }
            });
         } catch (e) {
            reject(e);
         }
      });
   }

}
