(() => {
   let userData = null;
   let translationsDisabled = false;
   let currentPageLangAttr = null;
   let currentPageFullUrl = null;
   let toggleSwitching = false;
   let currentPageTabs = null;
   let currentPageTab = null;
   let addToLibraryGroupShowed = false;
   let activeLibraryItem = null;
   let isLocalFileMode = false;
   let prevMyLangValue = null;
   let userSubscriptionActive = false;
   let interfaceLanguages = [];
   let isAuthenticating = false;
   let isLogouting = false;
   let addingUrlToLibrary = false;
   let libraryIsDisabled = false;
   let removingLibraryItem = false;
   let isUnsupportedLangShowing = false;
   let isScriptsInjected = false;

   const {successMessageResponse, sendChromeMessage, sendChromeMessageToTab, ...utils} = useUtils();

   const domNodes = {
      translationToggleSection: document.querySelector('#translation-toggle-section'),
      translationToggle: document.querySelector('#translation-toggle'),
      translationToggleText: document.querySelector('#translation-toggle-text'),
      signInSection: document.querySelector('#sign-in-section'),
      userSection: document.querySelector('#user-section'),
      logoutListItem: document.querySelector('#logout-list-item'),
      userName: document.querySelector('#user-name'),
      vocabularyListItem: document.querySelector('#vocabulary-list-item'),
      myLangSelect: document.querySelector('#my-lang-select'),
      translateLangSelect: document.querySelector('#translate-lang-select'),
      userCardAvatar: document.querySelector('#user-card-avatar'),
      userCardBtn: document.querySelector('#user-card-btn'),
      userCardList: document.querySelector('#user-card-list'),
      selectLangListItem: document.querySelector('#select-lang-list-item'),
      interfaceLangList: document.querySelector('#interface-lang-list'),
      selectLangModal: document.querySelector('#select-lang-modal'),
      signInMethodsSection: document.querySelector('#sign-in-methods-section'),
      signInEmailSection: document.querySelector('#sign-in-email-section'),
      notAccountText: document.querySelector('#not-account-text'),
      signInForm: document.querySelector('#sign-in-form'),
      signInEmail: document.querySelector('#sign-in-email'),
      signInPassword: document.querySelector('#sign-in-password'),
      submitSignInBtn: document.querySelector('#submit-sign-in-btn'),
      signInGoogleBtn: document.querySelector('#sign-in-google-btn'),
      signInWithEmailBtn: document.querySelector('#sign-in-with-email-btn'),
      loginMethods: document.querySelector('#login-methods'),
      dialog: document.querySelector('#dialog'),
      dialogTitle: document.querySelector('#dialog-title'),
      dialogMessage: document.querySelector('#dialog-message'),
      hideDialogBtn: document.querySelector('#hide-dialog-btn'),
      removeFromLibraryBtn: document.querySelector('#remove-from-library-btn'),
      currentYear: document.querySelector('#current-year'),
      mainLibraryInput: document.querySelector('#main-library-input'),
      mainLibraryDomain: document.querySelector('#main-library-domain'),
      urlsLibrary: document.querySelector('#urls-library'),
      otherLibraryItemTmpl: document.querySelector('#other-library-items-tmpl'),
      otherLibraryItems: document.querySelector('#other-library-items'),
      wrongLanguage: document.querySelector('#wrong-language'),
      addPageText: document.querySelector('#add-page-text'),
      addPageSecondText: document.querySelector('#add-page-second-text'),
      urlsLibraryContent: document.querySelector('#urls-library-content'),
      addPageBtn: document.querySelector('#add-page-btn'),
      addToLibraryGroup: document.querySelector('#add-to-library-group'),
      addToLibraryInput: document.querySelector('#add-to-library-input'),
      addToLibraryDomain: document.querySelector('#add-to-library-domain'),
      addUrlBtn: document.querySelector('#add-url-btn'),
      addToLibraryList: document.querySelector('#add-to-library-list'),
      mainLibraryGroup: document.querySelector('#main-library-group'),
      popupContainer: document.querySelector('#popup-container'),
      invalidPage: document.querySelector('#invalid-page'),
      unsupportedLanguage: document.querySelector('#unsupported-language'),
      billingLink: document.querySelector('#billing-link'),
      cancelAddingUrlBtn: document.querySelector('#cancel-adding-url-btn'),
      unsupportedDeterminedLanguage: document.querySelector('#unsupported-determined-language'),
      determinedLang: document.querySelector('#determined-lang'),
      wrongLanguageSecond: document.querySelector('#wrong-language-second')
   };

   const popupLocalizeData = {
      currentLocalizeJson: {},
      isLocalizeJsonLoad: false,
      localizeLoadError: false,
      currentLang: 'pl'
   };

   const popupLocalizeConfig = [
      {
         selector: document.querySelector('#l-my-lang'),
         path: 'myLang'
      }, {
         selector: document.querySelector('#l-login'),
         path: 'signInWithGoogle'
      }, {
         selector: document.querySelector('#l-vocabulary'),
         path: 'vocabulary'
      }, {
         selector: document.querySelector('#l-logout'),
         path: 'logout'
      }, {
         selector: document.querySelector('#l-language'),
         path: 'language'
      }, {
         selector: document.querySelector('#l-choose-lang'),
         path: 'chooseLang'
      }, {
         selector: document.querySelector('#l-sign-in'),
         path: 'signIn'
      }, {
         selector: document.querySelector('#l-not-account'),
         path: 'dontHaveAccount'
      }, {
         selector: document.querySelector('#l-email'),
         path: 'email'
      }, {
         selector: document.querySelector('#l-password'),
         path: 'password'
      }, {
         selector: document.querySelector('#l-email-login'),
         path: 'signInWithEmail'
      }, {
         selector: document.querySelector('#l-login-methods'),
         path: 'loginMethods'
      }, {
         selector: document.querySelector('#l-hide-dialog-btn'),
         path: 'close'
      }, {
         selector: document.querySelector('#l-page-lang'),
         path: 'pageLanguage'
      }, {
         selectors: [
            document.querySelector('#l-wrong-lang'),
            document.querySelector('#l-wrong-lang-second')
         ],
         path: 'wrongLanguage'
      }, {
         selector: document.querySelector('#l-add-page-main-text'),
         path: 'addUrlMainText'
      }, {
         selector: document.querySelector('#l-add-page-additional-text'),
         path: 'addUrlAdditionalText'
      }, {
         selector: document.querySelector('#l-add-page-btn'),
         path: 'addUrlBtn'
      }, {
         selector: document.querySelector('#l-invalid-page'),
         path: 'invalidPage'
      }, {
         selector: document.querySelector('#l-translation-toggle-text'),
         path: 'translationToggleText'
      }, {
         selector: document.querySelector('#l-unsupported-lang'),
         path: 'unsupportedLang'
      }, {
         selector: document.querySelector('#l-determined-unsupported-lang'),
         path: 'unsupportedDeterminedLang'
      }
   ];

   chrome.runtime.onMessage.addListener((req, sender, res) => {
      if (req.type === 'token-is-expired') {
         new Promise(async resolve => {
            try {
               await logout();
               await showDialog('', translate('sessionIsExpired'));
               resolve(successMessageResponse());
            } catch (e) {
               resolve(errorMessageResponse(e.message));
            }
         }).then(res);

         return true;
      }
   });

   if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
         initPopup();
      });
   } else {
      initPopup();
   }

   async function initPopup() {
      try {
         currentPageTabs = await utils.getCurrentPageTabs();
         currentPageTab = currentPageTabs[0];

         isScriptsInjected = await checkAvailabilityContentJs(currentPageTab);

         if (isScriptsInjected) {
            await loadCurrentPageData(currentPageTabs);
         }

         localizePopup();
         await onLocalizeJsonLoad();

         buildLoginBox();

         const currentUser = await getStorageUserData();

         if (!currentUser) {
            utils.hideElements(domNodes.userSection);
            utils.showElements(domNodes.signInSection);
            hideMenuItems();
         } else {
            if (!isScriptsInjected) {
               showInvalidPageMessage();
            }

            utils.hideElements(domNodes.signInSection);
            utils.showElements(domNodes.userSection);
            await initUserSection();
         }

         await initLangList();

         if (isScriptsInjected) {
            await detectPageLanguage(currentUser);
         } else if (!currentUser) {
            utils.showElements(domNodes.popupContainer);
         }

         initCurrentYear();

         domNodes.signInGoogleBtn.addEventListener('click', () => {
            loginWithGoogleHandler();
         });

         domNodes.signInWithEmailBtn.addEventListener('click', () => {
            if (!isAuthenticating) {
               hideLoginBox();
            }
         });

         initLangListEvents();

         domNodes.selectLangModal.addEventListener('click', e => {
            const id = e.target.getAttribute('id');
            if (id === 'selectLangModal') {
               closeLanguageModal();
            }
         });

         domNodes.hideDialogBtn.addEventListener('click', () => {
            hideDialog();
         });

         utils.showElements(domNodes.hideDialogBtn);

         domNodes.removeFromLibraryBtn.addEventListener('click', () => {
            removeFromUrlsLibraryHandler();
         });

         domNodes.vocabularyListItem.addEventListener('click', () => {
            openVocabulary();
         });

         domNodes.logoutListItem.addEventListener('click', () => {
            logout();
         });

         domNodes.wrongLanguage.addEventListener('click', () => {
            openFeedbackPage();
         });

         domNodes.wrongLanguageSecond.addEventListener('click', () => {
            openFeedbackPage();
         });

         domNodes.addPageBtn.addEventListener('click', () => {
            if (libraryIsDisabled || !userSubscriptionActive) {
               return;
            }

            if (addToLibraryGroupShowed === false) {
               showAddToLibraryGroup();
            } else {
               hideAddToLibraryGroup();
            }
         });

         domNodes.addUrlBtn.addEventListener('click', () => {
            if (libraryIsDisabled || !userSubscriptionActive) {
               return;
            }

            hideAddToLibraryGroup(false);
            addToUrlsLibraryHandler(domNodes.addToLibraryInput);
         });

         domNodes.addToLibraryInput.addEventListener('focus', event => {
            dropdownInputHandler(event, domNodes.addToLibraryList);
         });

         domNodes.addToLibraryInput.addEventListener('blur', () => {
            dropdownInputBlurHandler(domNodes.addToLibraryList);
         });

         domNodes.addToLibraryInput.addEventListener('input', event => {
            dropdownInputHandler(event, domNodes.addToLibraryList);
         });

         domNodes.addToLibraryList.addEventListener('click', event => {
            selectDropdownItem(event, domNodes.addToLibraryInput);
         });

         domNodes.billingLink.addEventListener('click', () => {
            openBillingPage();
         });

         domNodes.cancelAddingUrlBtn.addEventListener('click', () => {
            if (libraryIsDisabled || !userSubscriptionActive) {
               return;
            }

            hideAddToLibraryGroup();
         });

         setTimeout(() => {
            domNodes.translationToggle.classList.add('custom-checkbox_transition');
         }, 100);

         checkUserSubscription();
      } catch (e) {
         console.error(e);
         showErrorDialog(e);
      }
   }

   function initLangListEvents() {
      domNodes.interfaceLangList.addEventListener('click', e => {
         selectLang(e);
      });

      domNodes.selectLangListItem.addEventListener('click', () => {
         openLanguageModal();
      });
   }

   async function initUserSection() {
      userData = await getStorageUserData();
      domNodes.userName.textContent = userData.name;

      initUserAvatar(userData);

      setTimeout(() => {
         domNodes.userCardList.style.width = getComputedStyle(domNodes.userCardBtn).width;
      }, 500);

      await initSelects();

      await detectLibraryUrl();
      await initTranslateCheckbox();

      showMenuItems();

      await detectBaseUrl();
   }

   async function checkUserSubscription() {
      try {
         userSubscriptionActive = await isUserSubscriptionActive();

         if (userSubscriptionActive) {
            document.body.classList.remove('inactive-subscription');
         } else {
            document.body.classList.add('inactive-subscription');
         }
      } catch (e) {
         console.error(e);
         showErrorDialog(e);
      }
   }

   function getPathSegments() {
      const {pathname, origin} = new URL(currentPageFullUrl);
      const segments = pathname.split('/').filter(el => el);
      const originUrl = origin + '/';
      return segments.map((el, idx) => originUrl + segments.slice(0, idx + 1).join('/'));
   }

   function initDropdownInput(listElement, inputValue = null, showList = false) {
      let segments = getPathSegments();

      if (segments.length) {
         const items = [];

         for (const el of segments.splice(0, 3)) {
            const item = utils.createDOMElement('li', {
               children: [
                  utils.createDOMElement('a', 'dropdown-item', {
                     attributes: {
                        href: '#'
                     },
                     text: el
                  })
               ]
            });

            if (inputValue && !el.toLowerCase().includes(inputValue)) {
               utils.hideElements(item);
            }

            items.push(item);
         }

         utils.removeChildrenAndAppend(listElement, ...items);

         if (showList) {
            utils.showElements(listElement);
         }
      }
   }

   function dropdownInputHandler(event, listElement) {
      try {
         const inputValue = event?.target?.value?.toLowerCase() || '';

         let showedItems = 0;

         for (const el of Array.from(listElement.children)) {
            if (el.firstChild.textContent.toLowerCase().includes(inputValue)) {
               utils.showElements(el);
               showedItems++;
            } else {
               utils.hideElements(el);
            }
         }

         if (showedItems) {
            utils.showElements(listElement);
         } else {
            utils.hideElements(listElement);
         }
      } catch (e) {
         console.error(e);
         showErrorDialog(e);
      }
   }

   function dropdownInputBlurHandler(listElement) {
      setTimeout(() => {
         utils.hideElements(listElement);
      }, 100);
   }

   function selectDropdownItem(event, inputElement) {
      const elem = event.target.closest('.dropdown-item');

      if (elem) {
         const {origin} = new URL(currentPageFullUrl);
         inputElement.value = elem.textContent.replace(origin + '/', '');
      }
   }

   function showAddToLibraryGroup() {
      try {
         domNodes.addPageBtn.classList.add('mb-15');

         addToLibraryGroupShowed = true;

         const {origin} = new URL(currentPageFullUrl);
         domNodes.addToLibraryDomain.textContent = origin + '/';

         domNodes.addToLibraryGroup.classList.remove('library-not-editable');

         utils.showElements(domNodes.addToLibraryGroup);
         initDropdownInput(domNodes.addToLibraryList, null, true);

         domNodes.addToLibraryInput.focus();
      } catch (e) {
         console.error(e);
         showErrorDialog(e);
      }
   }

   function hideAddToLibraryGroup(clearInput = true) {
      try {
         domNodes.addPageBtn.classList.remove('mb-15');

         addToLibraryGroupShowed = false;

         domNodes.addToLibraryGroup.classList.add('library-not-editable');
         utils.hideElements(domNodes.addToLibraryGroup);
         utils.removeChildren(domNodes.addToLibraryList);

         if (clearInput) {
            domNodes.addToLibraryInput.value = '';
         }
      } catch (e) {
         console.error(e);
         showErrorDialog(e);
      }
   }

   async function openFeedbackPage() {
      try {
         if (!isLogouting && !libraryIsDisabled && !isLocalFileMode) {
            await sendChromeMessage('init-feedback-data', {
               url: currentPageFullUrl,
               lang: domNodes.translateLangSelect.value
            });

            window.open(`http://localhost:4200/feedback`);
         }
      } catch (e) {
         console.error(e);
         showErrorDialog(e);
      }
   }

   async function openBillingPage() {
      try {
         if (!isLogouting && !libraryIsDisabled) {
            window.open(`http://localhost:4200/billing`, '_blank');
         }
      } catch (e) {
         console.error(e);
         showErrorDialog(e);
      }
   }

   function initCurrentYear() {
      try {
         domNodes.currentYear.textContent = new Date().getFullYear().toString();
      } catch (e) {
         console.error(e);
         showErrorDialog(e);
      }
   }

   function disableLibrary() {
      libraryIsDisabled = true;
      utils.disableElements(domNodes.addUrlBtn);
      utils.disableElements(domNodes.addPageBtn);
      utils.disableElements(domNodes.translationToggle);
      utils.disableElements(domNodes.removeFromLibraryBtn);
      utils.disableElements(domNodes.userCardBtn);
      utils.disableElements(domNodes.myLangSelect);
      utils.disableElements(domNodes.logoutListItem);
      domNodes.otherLibraryItems.classList.add('other-library-items_disabled');
   }

   function enableLibrary() {
      utils.enableElements(domNodes.addUrlBtn);
      utils.enableElements(domNodes.addPageBtn);
      utils.enableElements(domNodes.translationToggle);
      utils.enableElements(domNodes.removeFromLibraryBtn);
      utils.enableElements(domNodes.userCardBtn);
      utils.enableElements(domNodes.myLangSelect);
      utils.enableElements(domNodes.logoutListItem);
      domNodes.otherLibraryItems.classList.remove('other-library-items_disabled');
      libraryIsDisabled = false;
   }

   async function addToUrlsLibraryHandler(inputElement) {
      try {
         if (!currentPageFullUrl || addingUrlToLibrary || isLocalFileMode) {
            return;
         }
         addingUrlToLibrary = true;
         disableLibrary();

         const urlRegex = /^(https:\/\/)(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+(\/[a-zA-Z0-9-._~:\/?#[\]@!$&'()*+,;%=]*)?$/;
         const {origin} = new URL(currentPageFullUrl);

         const libraryInputValue = inputElement?.value?.trim() || '';
         const basePageUrl = origin + '/';
         const firstInputCharacter = libraryInputValue.length ? libraryInputValue[0].trim() : '';
         const lastBaseUrlValue = basePageUrl[basePageUrl.length - 1];
         let separator = '';

         if (libraryInputValue.length && firstInputCharacter !== '/' && lastBaseUrlValue !== '/') {
            separator = '/';
         }

         const fullPageUrl = basePageUrl + separator + libraryInputValue;

         const urlsLibraryItem = await getCurrentPageLibraryItem(fullPageUrl, true);

         if (urlsLibraryItem) {
            inputElement.value = '';
            enableLibrary();
            addingUrlToLibrary = false;
            return;
         }

         if (!urlRegex.test(fullPageUrl)) {
            throw new Error('The URL is not valid!');
         }

         const addedLibraryItem = await addToUrlsLibrary(fullPageUrl);

         await detectLibraryUrl();
         await detectBaseUrl();

         const currentPageLibraryItem = await getCurrentPageLibraryItem();

         if (currentPageLibraryItem && currentPageLibraryItem.id === addedLibraryItem.id) {
            domNodes.translationToggle.checked = true;
         }

         inputElement.value = '';

         enableLibrary();
         addingUrlToLibrary = false;
      } catch (e) {
         console.error(e);
         showErrorDialog(e);
         enableLibrary();
         addingUrlToLibrary = false;
      }
   }

   async function removeFromUrlsLibraryHandler() {
      try {
         if (!currentPageFullUrl || removingLibraryItem || libraryIsDisabled || isLocalFileMode || !userSubscriptionActive) {
            return;
         }
         removingLibraryItem = true;
         disableLibrary();

         await sendChromeMessage('remove-from-urls-library', {
            id: activeLibraryItem.id,
            domain: activeLibraryItem.domain
         });
         await detectLibraryUrl();
         await detectBaseUrl();

         const currentPageLibraryItem = await getCurrentPageLibraryItem();
         if (!currentPageLibraryItem) {
            domNodes.translationToggle.checked = false;
         }

         enableLibrary();
         removingLibraryItem = false;
      } catch (e) {
         console.error(e);
         showErrorDialog(e);
         enableLibrary();
         removingLibraryItem = false;
      }
   }

   function compareLandCodeWithPageLang(langCode) {
      if (!currentPageLangAttr || !langCode) {
         return false;
      }

      const langCodeFormatted = langCode.toLowerCase().trim();
      const langAttrFormatted = currentPageLangAttr.toLowerCase().trim();

      if (langAttrFormatted === langCodeFormatted || langAttrFormatted.includes(langCodeFormatted)) {
         return true;
      }

      return false;
   }

   async function detectPageLanguage(currentUser) {
      try {
         if (!currentPageLangAttr || !currentUser) {
            utils.showElements(domNodes.popupContainer);
            return;
         }

         const determinedLang = getDeterminedLang();

         if (determinedLang && determinedLang.supported && determinedLang.code) {
            utils.showElements(domNodes.popupContainer);
         } else {
            await showUnsupportedLang(determinedLang);
         }
      } catch (e) {
         utils.showElements(domNodes.popupContainer);
         console.error(e);
         showErrorDialog(e);
      }
   }

   async function detectLibraryUrl() {
      if (isLocalFileMode) {
         return;
      }

      if (currentPageFullUrl && currentPageLangAttr && compareLandCodeWithPageLang(domNodes.translateLangSelect.value)) {
         const urlsLibraryItems = await sendChromeMessage('get-urls-library-items-by-domain', {
            fullUrl: currentPageFullUrl,
            from: domNodes.translateLangSelect.value,
            to: domNodes.myLangSelect.value
         });

         const urlsLibraryItem = await getCurrentPageLibraryItem();

         activeLibraryItem = urlsLibraryItem || null;

         if (!urlsLibraryItems || !urlsLibraryItems.length) {
            utils.showElements(domNodes.addPageSecondText);
            utils.hideElements(domNodes.urlsLibraryContent);
            domNodes.addPageBtn.classList.remove('btn_mb-15');

            await renderOtherUrlsLibraryItems([], null);
         } else {
            utils.hideElements(domNodes.addPageSecondText);
            utils.showElements(domNodes.urlsLibraryContent);
            domNodes.addPageBtn.classList.add('btn_mb-15');

            await renderOtherUrlsLibraryItems(urlsLibraryItems, urlsLibraryItem);

            if (urlsLibraryItem) {
               utils.showElements(domNodes.mainLibraryGroup);
               utils.showElements(domNodes.translationToggleSection);
            } else {
               utils.hideElements(domNodes.mainLibraryGroup);
               utils.hideElements(domNodes.translationToggleSection);
            }
         }

         utils.showElements(domNodes.urlsLibrary);
      } else {
         utils.hideElements(domNodes.urlsLibrary);
         utils.hideElements(domNodes.translationToggleSection);
      }
   }

   function clearLibrary() {
      domNodes.addToLibraryInput.value = '';
      domNodes.addToLibraryDomain.textContent = '';
      domNodes.mainLibraryInput.value = '';
      domNodes.mainLibraryDomain.textContent = '';
      utils.removeChildren(domNodes.otherLibraryItems);
      hideAddToLibraryGroup(false);
   }

   async function detectBaseUrl() {
      if (currentPageFullUrl && !isLocalFileMode) {
         const {origin} = new URL(currentPageFullUrl);
         domNodes.mainLibraryDomain.textContent = origin + '/';

         const urlsLibraryItem = await getCurrentPageLibraryItem();

         if (urlsLibraryItem?.url) {
            const {pathname, search, hash} = new URL(urlsLibraryItem.url);
            const partOfUrl = pathname + search + hash;

            if (partOfUrl && partOfUrl !== '/') {
               const inputValue = partOfUrl.startsWith('/') ? partOfUrl.replace('/', '') : partOfUrl;
               domNodes.mainLibraryInput.value = inputValue;
            } else {
               domNodes.mainLibraryInput.value = '';
            }
         } else {
            domNodes.mainLibraryInput.value = '';
         }
      }
   }

   async function renderOtherUrlsLibraryItems(urlsLibraryItems, urlsLibraryItem) {
      const idx = urlsLibraryItem ? urlsLibraryItems.findIndex(el => el.id === urlsLibraryItem.id) : -1;

      if (idx !== -1) {
         urlsLibraryItems.splice(idx, 1);
      }

      utils.removeChildren(domNodes.otherLibraryItems);

      if (urlsLibraryItems.length) {
         for (let i = 0; i < urlsLibraryItems.length; i++) {
            const item = urlsLibraryItems[i];

            const otherUrlsLibraryItem = domNodes.otherLibraryItemTmpl.content.cloneNode(true);

            const {origin, pathname, search, hash} = new URL(item.url);
            otherUrlsLibraryItem.querySelector('.urls-library__url').textContent = origin;

            const partOfUrl = pathname + search + hash;

            if (partOfUrl && partOfUrl !== '/') {
               otherUrlsLibraryItem.querySelector('.urls-library__input').value = partOfUrl;
            }

            const checkboxInput = otherUrlsLibraryItem.querySelector('.custom-checkbox');
            const checkboxLabel = otherUrlsLibraryItem.querySelector('.activity-toggle');
            const inputId = `checkboxInput-${i + 1}`;

            checkboxInput.setAttribute('id', inputId);
            checkboxLabel.setAttribute('for', inputId);

            checkboxInput.checked = item.enabled;

            const rootElement = otherUrlsLibraryItem.querySelector('.col-12');

            checkboxInput.addEventListener('change', async (event) => {
               try {
                  if (typeof event.target.checked !== 'boolean' || libraryIsDisabled || !userSubscriptionActive) {
                     return;
                  }

                  await sendChromeMessage('toggle-urls-library-item', {
                     id: item.id,
                     domain: item.domain,
                     enabled: event.target.checked
                  });
               } catch (e) {
                  console.error(e);
                  showErrorDialog(e);
               }
            });

            otherUrlsLibraryItem.querySelector('.btn_remove').addEventListener('click', async () => {
               try {
                  if (libraryIsDisabled || removingLibraryItem || !userSubscriptionActive) {
                     return;
                  }
                  removingLibraryItem = true;
                  disableLibrary();

                  await sendChromeMessage('remove-from-urls-library', {
                     id: item.id,
                     domain: item.domain
                  });
                  rootElement.remove();

                  enableLibrary();
                  removingLibraryItem = false;
               } catch (e) {
                  console.error(e);
                  showErrorDialog(e);
                  enableLibrary();
                  removingLibraryItem = false;
               }
            });

            domNodes.otherLibraryItems.append(otherUrlsLibraryItem);
         }

         utils.showElements(domNodes.otherLibraryItems);
      } else {
         utils.hideElements(domNodes.otherLibraryItems);
      }
   }

   async function getCurrentPageLibraryItem(fullUrl = currentPageFullUrl, completeMatch = false, to = null) {
      return sendChromeMessage('get-urls-library-item', {
         fullUrl,
         from: domNodes.translateLangSelect.value,
         to: to || domNodes.myLangSelect.value,
         completeMatch
      });
   }

   async function addToUrlsLibrary(fullPageUrl) {
      return sendChromeMessage('add-to-urls-library', {
         domain: utils.getDomain(currentPageFullUrl),
         url: fullPageUrl,
         from: domNodes.translateLangSelect.value,
         to: domNodes.myLangSelect.value
      });
   }

   async function isUserSubscriptionActive() {
      return sendChromeMessage('is-user-subscription-active');
   }

   function buildLoginBox() {
      if (isGoogleLogin()) {
         showLoginBox();
         utils.showElements(domNodes.loginMethods);

         domNodes.loginMethods.addEventListener('click', () => {
            if (!isAuthenticating) {
               showLoginBox();
            }
         });
      } else {
         utils.hideElements(domNodes.loginMethods);
         hideLoginBox();
      }

      domNodes.notAccountText.addEventListener('click', () => {
         if (!isAuthenticating) {
            window.open('http://localhost:4200/login?type=register');
         }
      });

      domNodes.signInForm.addEventListener('submit', e => {
         e.preventDefault();
         loginWithEmailHandler();
      });
   }

   async function loginWithEmailHandler() {
      try {
         if (isAuthenticating) {
            return;
         }
         disableAuthenticating();

         const email = domNodes.signInEmail?.value?.trim();
         const password = domNodes.signInPassword?.value?.trim();

         if (!email.length && !password.length) {
            enableAuthenticating();
            return;
         }

         emailValidator(email);
         passwordValidator(password);

         await sendChromeMessage('login-with-email', {email, password});
         await loginProcess();
         domNodes.signInForm.reset();

         enableAuthenticating();
      } catch (e) {
         console.error(e);
         showErrorDialog(e);
         enableAuthenticating();
      }
   }

   async function loginWithGoogleHandler() {
      try {
         if (isAuthenticating) {
            return;
         }
         disableAuthenticating();

         await sendChromeMessage('login-with-google');
         await loginProcess();

         enableAuthenticating();
      } catch (e) {
         console.error(e);
         showErrorDialog(e);
         enableAuthenticating();
      }
   }

   async function loginProcess() {
      if (isScriptsInjected) {
         if (currentPageLangAttr) {
            const determinedLang = getDeterminedLang();

            if (!determinedLang || !determinedLang.code || !determinedLang.supported) {
               await showUnsupportedLang(determinedLang);
            }
         }
      } else {
         showInvalidPageMessage();
      }

      await checkUserSubscription();
      utils.hideElements(domNodes.signInSection);
      utils.showElements(domNodes.userSection);
      await initUserSection();
   }

   function disableAuthenticating() {
      isAuthenticating = true;
      utils.disableElements(domNodes.submitSignInBtn);
      utils.disableElements(domNodes.signInGoogleBtn);
      utils.disableElements(domNodes.userCardBtn);
      utils.disableElements(domNodes.signInEmail);
      utils.disableElements(domNodes.signInPassword);
      utils.disableElements(domNodes.signInWithEmailBtn);
   }

   function enableAuthenticating() {
      utils.enableElements(domNodes.submitSignInBtn);
      utils.enableElements(domNodes.signInGoogleBtn);
      utils.enableElements(domNodes.userCardBtn);
      utils.enableElements(domNodes.signInEmail);
      utils.enableElements(domNodes.signInPassword);
      utils.enableElements(domNodes.signInWithEmailBtn);
      isAuthenticating = false;
   }

   function emailValidator(email) {
      const emailPattern = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

      if (email.length < 6 || email.length > 50 || !emailPattern.test(email)) {
         throw new Error(translate('emailIsInvalid'));
      }
   }

   function passwordValidator(password) {
      if (password.length < 8 || password.length > 32) {
         throw new Error(translate('passwordIsInvalid'));
      }
   }

   async function selectLang(event) {
      const li = event.target.closest('li');

      if (!li) {
         return;
      }

      const lang = li.getAttribute('data-lang');
      await changeLang(lang);
      closeLanguageModal();
      await initLangList();
   }

   async function initLangList() {
      try {
         const list = [];
         const langs = await getInterfaceLanguages();

         for (const langCode of langs) {
            const classes = ['langList__item'];

            if (langCode === popupLocalizeData.currentLang) {
               classes.push('langList__item-active');
            }

            const listItem = utils.createDOMElement('li', classes, {
               attributes: {
                  'data-lang': langCode
               },
               children: [
                  utils.createDOMElement('span', {
                     text: languages[langCode].localize[popupLocalizeData.currentLang]
                  })
               ]
            });

            list.push(listItem);
         }

         utils.removeChildrenAndAppend(domNodes.interfaceLangList, ...list);
      } catch (e) {
         console.error(e);
         showErrorDialog(e);
      }
   }

   async function initSelects() {
      utils.removeChildren(domNodes.translateLangSelect, domNodes.myLangSelect);

      const determinedLang = getDeterminedLang();

      if (!determinedLang || !determinedLang.code || !determinedLang.supported) {
         return;
      }

      checkUserFromLang(determinedLang.code);

      const interfaceLang = await getInterfaceLang();

      domNodes.translateLangSelect.append(createLangOption(determinedLang.code, interfaceLang));
      domNodes.translateLangSelect.value = determinedLang.code;

      const options = [];

      for (const lang of determinedLang.couples) {
         const option = createLangOption(lang, interfaceLang);
         options.push(option);
      }

      domNodes.myLangSelect.append(...options);
      domNodes.myLangSelect.value = await getUserLang('to');

      prevMyLangValue = domNodes.myLangSelect.value;

      domNodes.myLangSelect.removeEventListener('change', changeLangHandler);
      domNodes.myLangSelect.addEventListener('change', changeLangHandler);
   }

   function createLangOption(optionLang, interfaceLang) {
      return utils.createDOMElement('option', {
         attributes: {
            value: optionLang
         },
         text: languages[optionLang].localize[interfaceLang]
      });
   }

   async function checkUserFromLang(determinedLangCode) {
      try {
         const userFromLang = await getUserLang('from');
         if (userFromLang !== determinedLangCode) {
            await updateUserSettings({from: determinedLangCode});
         }
      } catch (e) {
         console.error(e);
      }
   }

   async function changeLangHandler(event) {
      try {
         const langType = event.target.dataset.langKey.toLowerCase();
         await changeLangProcess(langType, event.target.value);
      } catch (e) {
         console.error(e);
         showErrorDialog(e);
      }
   }

   async function changeLangProcess(langType, langCode) {
      if (!currentPageFullUrl) {
         return;
      }

      if (!isLocalFileMode) {
         const urlsLibraryItem = await getCurrentPageLibraryItem(currentPageFullUrl, false, prevMyLangValue);

         if (urlsLibraryItem?.enabled) {
            await sendChromeMessage('toggle-urls-library-item', {
               id: urlsLibraryItem.id,
               domain: urlsLibraryItem.domain,
               enabled: false
            });
         }
      }

      prevMyLangValue = langCode;

      if (domNodes.translationToggle.checked) {
         domNodes.translationToggle.checked = false;
      }

      await updateUserSettings({[langType]: langCode});
      await detectLibraryUrl();
      hideAddToLibraryGroup();
   }

   async function logout() {
      try {
         if (isLogouting || libraryIsDisabled) {
            return;
         }
         disableLogouting();

         await sendChromeMessage('logout');

         utils.hideElements(domNodes.userSection);
         utils.showElements(domNodes.signInSection);

         hideMenuItems();

         if (isScriptsInjected) {
            if (isUnsupportedLangShowing) {
               hideUnsupportedLang();
            }
         } else {
            hideInvalidPageMessage();
         }

         utils.removeChildren(domNodes.userName, domNodes.userCardAvatar);
         clearLibrary();

         document.body.classList.remove('inactive-subscription');

         enableLogouting();
      } catch (e) {
         console.error(e);
         showErrorDialog(e);
         enableLogouting();
      }
   }

   function disableLogouting() {
      isLogouting = true;
      utils.disableElements(domNodes.logoutListItem);
      utils.disableElements(domNodes.userCardBtn);
      utils.disableElements(domNodes.myLangSelect);
      utils.disableElements(domNodes.addPageBtn);
   }

   function enableLogouting() {
      utils.enableElements(domNodes.logoutListItem);
      utils.enableElements(domNodes.userCardBtn);
      utils.enableElements(domNodes.myLangSelect);
      utils.enableElements(domNodes.addPageBtn);
      isLogouting = false;
   }

   async function getUserLang(key) {
      try {
         const user = await getStorageUserData();

         if (!user) {
            return 'pl';
         }

         return user[key] || 'pl';
      } catch (e) {
         console.error(e);
         return 'pl';
      }
   }

   async function getStorageUserData() {
      return sendChromeMessage('get-storage-user');
   }

   async function initTranslateCheckbox() {
      if (domNodes.translationToggle && currentPageFullUrl) {
         if (!isLocalFileMode) {
            const urlsLibraryItem = await getCurrentPageLibraryItem();

            if (urlsLibraryItem) {
               domNodes.translationToggle.checked = urlsLibraryItem.enabled === true;
            }
         }

         domNodes.translationToggle.removeEventListener('change', translateCheckboxHandler);
         domNodes.translationToggle.addEventListener('change', translateCheckboxHandler);
      }
   }

   async function translateCheckboxHandler(event) {
      try {
         if (translationsDisabled || toggleSwitching || libraryIsDisabled || !userSubscriptionActive) {
            return;
         }
         toggleSwitching = true;
         utils.disableElements(domNodes.translationToggle);

         if (typeof event.target.checked === 'boolean') {
            if (!isLocalFileMode) {
               await sendChromeMessage('toggle-urls-library-item', {
                  id: activeLibraryItem.id,
                  domain: activeLibraryItem.domain,
                  enabled: event.target.checked
               });
            }
         } else {
            throw new Error('Invalid toggle value!');
         }

         utils.enableElements(domNodes.translationToggle);
         toggleSwitching = false;
      } catch (e) {
         console.error(e);
         showErrorDialog(e);
         utils.enableElements(domNodes.translationToggle);
         toggleSwitching = false;
      }
   }

   async function updateUserSettings(body) {
      userData = await sendChromeMessage('update-current-user', body);
      return userData;
   }

   async function getInterfaceLang() {
      return sendChromeMessage('get-interface-lang');
   }

   async function getInterfaceLanguages() {
      if (!interfaceLanguages.length) {
         interfaceLanguages = await sendChromeMessage('get-interface-languages');
      }

      return interfaceLanguages;
   }

   async function onLocalizeJsonLoad() {
      try {
         if (popupLocalizeData.isLocalizeJsonLoad || popupLocalizeData.localizeLoadError) {
            return true;
         }

         return await new Promise(resolve => {
            let interval = setInterval(() => {
               if (popupLocalizeData.isLocalizeJsonLoad || popupLocalizeData.localizeLoadError) {
                  clearInterval(interval);
                  resolve(true);
                  return true;
               }
            }, 10);
         });
      } catch (e) {
         console.error(e);
         showErrorDialog(e);
         return false;
      }
   }

   async function localizePopup() {
      try {
         const lang = await getInterfaceLang();

         const res = await fetch(`/_locales/${lang}/messages.json`);

         popupLocalizeData.currentLang = lang;
         popupLocalizeData.currentLocalizeJson = await res.json();
         popupLocalizeData.isLocalizeJsonLoad = true;

         for (const el of popupLocalizeConfig) {
            try {
               if (!el || !el.path) {
                  continue;
               }

               if (el.selector) {
                  el.selector.textContent = translate(el.path);
               } else if (el.selectors) {
                  for (const selector of el.selectors) {
                     selector.textContent = translate(el.path);
                  }
               }
            } catch (e) {
               console.error(e);
            }
         }

         domNodes.wrongLanguage.setAttribute('title', translate('wrongLanguageTitle'));
         domNodes.wrongLanguageSecond.setAttribute('title', translate('wrongLanguageTitle'));

         await localizeDeterminedLang(null, lang);
      } catch (e) {
         console.error(e);
         popupLocalizeData.localizeLoadError = true;
         showErrorDialog(e);
      }
   }

   async function localizeDeterminedLang(determinedLang, interfaceLang) {
      if (!determinedLang) {
         determinedLang = getDeterminedLang();
      }

      if (determinedLang && determinedLang.code && languages[determinedLang.code]) {
         if (!interfaceLang) {
            interfaceLang = await getInterfaceLang();
         }

         domNodes.determinedLang.textContent = languages[determinedLang.code].localize[interfaceLang];
      }
   }

   async function changeLang(lang) {
      try {
         await sendChromeMessage('change-interface-lang', {lang});
         await localizePopup();
         await initSelects();
      } catch (e) {
         console.error(e);
         showErrorDialog(e);
      }
   }

   function translate(path) {
      try {
         if (!path) {
            return '';
         }

         let value = '';
         const keys = path.split('.');

         for (const key of keys) {
            value = value ? value[key] : popupLocalizeData.currentLocalizeJson[key];
         }

         if (value && value.message) {
            value = value.message;
         }

         return value || path;
      } catch (e) {
         console.error(e);
         return path || '';
      }
   }

   function initUserAvatar(userData) {
      try {
         let userAvatar;

         if (userData.avatar) {
            userAvatar = generateUserAvatar(userData.avatar);
         } else {
            userAvatar = generateUserAvatarPlug(userData.name);
         }

         if (userAvatar) {
            utils.removeChildrenAndAppend(domNodes.userCardAvatar, userAvatar);
         }
      } catch (e) {
         console.error(e);
         showErrorDialog(e);
      }
   }

   function generateUserAvatarPlug(name) {
      try {
         if (!name) {
            return null;
         }

         return utils.createDOMElement('div', 'userCard__avatarPlug', {
            text: name[0] || ''
         });
      } catch (e) {
         console.error(e);
         showErrorDialog(e);
         return null;
      }
   }

   function generateUserAvatar(src) {
      try {
         return utils.createDOMElement('img', 'userCard__avatar', {
            attributes: {
               src,
               alt: 'Avatar'
            }
         });
      } catch (e) {
         console.error(e);
         showErrorDialog(e);
         return null;
      }
   }

   async function loadCurrentPageData(currentTabs) {
      try {
         const currentPageData = await sendChromeMessageToTab('getCurrentPageData', null, currentTabs[0].id, currentTabs);
         currentPageLangAttr = currentPageData?.langAttr || null;
         currentPageFullUrl = currentPageData?.fullUrl || null;

         detectLocalFileMode();
      } catch (e) {
         console.error(e);
         showErrorDialog(e);
      }
   }

   function detectLocalFileMode() {
      isLocalFileMode = utils.detectLocalFileMode(currentPageFullUrl);

      if (isLocalFileMode) {
         domNodes.urlsLibrary.classList.add('local-file-mode');

         utils.hideElements(domNodes.addPageText);
         utils.hideElements(domNodes.addPageBtn);
         utils.showElements(domNodes.urlsLibrary);
         utils.showElements(domNodes.urlsLibraryContent);
         utils.showElements(domNodes.translationToggleSection);
         utils.showElements(domNodes.translationToggleText);

         utils.makeInvisible(domNodes.wrongLanguage);
      }
   }

   function openLanguageModal() {
      utils.showElements(domNodes.selectLangModal);
   }

   function closeLanguageModal() {
      utils.hideElements(domNodes.selectLangModal);
   }

   function openVocabulary() {
      try {
         window.open('http://localhost:4200/vocabulary');
      } catch (e) {
         console.error(e);
         showErrorDialog(e);
      }
   }

   function isGoogleLogin() {
      return Boolean(chrome?.identity?.launchWebAuthFlow);
   }

   function showMenuItems() {
      utils.showElements(domNodes.vocabularyListItem);
      utils.showElements(domNodes.logoutListItem);
      utils.showElements(domNodes.userName);
      utils.showElements(domNodes.userCardAvatar);
   }

   function hideMenuItems() {
      utils.hideElements(domNodes.vocabularyListItem);
      utils.hideElements(domNodes.logoutListItem);
      utils.hideElements(domNodes.userName);
      utils.hideElements(domNodes.userCardAvatar);
   }

   function hideLoginBox() {
      utils.showElements(domNodes.signInEmailSection);
      utils.hideElements(domNodes.signInMethodsSection);
   }

   function showLoginBox() {
      utils.showElements(domNodes.signInMethodsSection);
      utils.hideElements(domNodes.signInEmailSection);
   }

   function disabledActivityToggle() {
      translationsDisabled = true;
      utils.disableElements(domNodes.translationToggle);
   }

   function enableActivityToggle() {
      translationsDisabled = false;
      utils.enableElements(domNodes.translationToggle);
   }

   async function checkAvailabilityContentJs(currentTab) {
      try {
         disabledActivityToggle();

         const isScriptsInjected = await new Promise(async (resolve, reject) => {
            const initTabCb = queryCb => {
               try {
                  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
                     try {
                        queryCb(tabs[0]);
                     } catch (e) {
                        reject(e);
                     }
                  });
               } catch (e) {
                  console.error(e);
                  reject(e);
               }
            };

            const sendMessageCb = tab => {
               try {
                  const matches = [{
                     startsWith: 'https://',
                     endsWith: ''
                  }, {
                     startsWith: 'http://',
                     endsWith: ''
                  }, {
                     startsWith: 'file:///',
                     endsWith: '.html'
                  }, {
                     startsWith: 'file:///',
                     endsWith: '.htm'
                  }];

                  if (matches.every(el => {
                     return !(tab.url.startsWith(el.startsWith) && tab.url.endsWith(el.endsWith));
                  })) {
                     resolve(false);
                     return;
                  }

                  chrome.tabs.sendMessage(tab.id, {type: 'check-injection'}, res => {
                     if (res?.status !== 'success') {
                        resolve(false);
                     } else {
                        resolve(true);
                     }
                  });
               } catch (e) {
                  console.error(e);
                  reject(e);
               }
            };

            if (currentTab) {
               sendMessageCb(currentTab);
            } else {
               initTabCb(sendMessageCb);
            }
         });

         enableActivityToggle();

         return isScriptsInjected;
      } catch (e) {
         console.error(e);
         enableActivityToggle();
         return false;
      }
   }

   async function showDialog(title, message) {
      domNodes.dialogTitle.textContent = title;
      domNodes.dialogMessage.textContent = message;
      utils.showElements(domNodes.dialog);
   }

   async function showErrorDialog(error, title) {
      if (!title) {
         title = translate('error');
      }

      await showDialog(title, utils.getErrorMessage(error));
   }

   async function hideDialog() {
      domNodes.dialogTitle.textContent = 'Title';
      domNodes.dialogMessage.textContent = 'Message';
      utils.hideElements(domNodes.dialog);
   }

   function showInvalidPageMessage() {
      utils.hideElements(domNodes.popupContainer);
      utils.showElements(domNodes.invalidPage);
   }

   function hideInvalidPageMessage() {
      utils.showElements(domNodes.popupContainer);
      utils.hideElements(domNodes.invalidPage);
   }

   function getDeterminedLang() {
      for (const [key, value] of Object.entries(languages)) {
         const lang = value.codes.find(el => el === currentPageLangAttr);

         if (lang) {
            return {
               code: key,
               ...value
            };
         }
      }

      return null;
   }

   async function showUnsupportedLang(determinedLang) {
      await localizeDeterminedLang(determinedLang);

      if (determinedLang) {
         utils.hideElements(domNodes.popupContainer);
         utils.showElements(domNodes.unsupportedDeterminedLanguage);
      } else {
         utils.hideElements(domNodes.popupContainer);
         utils.showElements(domNodes.unsupportedLanguage);
      }

      isUnsupportedLangShowing = true;
   }

   function hideUnsupportedLang() {
      utils.showElements(domNodes.popupContainer);
      utils.hideElements(domNodes.unsupportedLanguage);
      utils.hideElements(domNodes.unsupportedDeterminedLanguage);
      isUnsupportedLangShowing = false;
   }

})();
