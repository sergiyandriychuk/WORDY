const useUtils = () => {
   const getErrorMessage = error => {
      const defaultErrorMessage = 'Unknown error';

      try {
         return error?.message || defaultErrorMessage;
      } catch (e) {
         console.error(e);
         return defaultErrorMessage;
      }
   };

   function isObject(obj) {
      return typeof obj === 'object' && !Array.isArray(obj) && obj !== null;
   }

   const createDOMElement = (tag, classesOrConfig = [], config = {}) => {
      const element = document.createElement(tag);
      const classes = [];

      if (isObject(classesOrConfig)) {
         config = classesOrConfig;
      } else if (Array.isArray(classesOrConfig)) {
         classes.push(...classesOrConfig);
      } else if (typeof classesOrConfig === 'string') {
         classes.push(classesOrConfig);
      }

      const {classes: configClasses, attributes, text, styles, children, events} = config;

      if (Array.isArray(configClasses)) {
         classes.push(...configClasses);
      }

      if (Array.isArray(classes) && classes.length) {
         element.classList.add(...classes);
      }

      if (attributes) {
         Object.entries(attributes).forEach(attr => {
            if (attr[0]) {
               element.setAttribute(attr[0], attr[1]);
            }
         });
      }

      if (text && typeof text === 'string') {
         element.textContent = text;
      }

      if (styles) {
         Object.entries(styles).forEach(style => {
            if (style[0]) {
               element.style[style[0]] = style[1];
            }
         });
      }

      if (events) {
         Object.entries(events).forEach(event => {
            if (event[0] && event[1]) {
               element.addEventListener(event[0], event[1]);
            }
         });
      }

      if (Array.isArray(children)) {
         element.append(...children);
      }

      return element;
   };

   const removeChildren = (...DOMElements) => {
      for (const DOMElement of DOMElements) {
         DOMElement.textContent = '';
      }
   };

   const removeChildrenAndAppend = (rootElement, ...nodes) => {
      removeChildren(rootElement);
      rootElement.append(...nodes);
   };

   const disableElements = (...DOMElements) => {
      for (const DOMElement of DOMElements) {
         DOMElement.setAttribute('disabled', 'true');
      }
   };

   const enableElements = (...DOMElements) => {
      for (const DOMElement of DOMElements) {
         DOMElement.removeAttribute('disabled');
      }
   };

   const hideElements = (...DOMElements) => {
      for (const DOMElement of DOMElements) {
         DOMElement.setAttribute('hidden', 'true');
      }
   };

   const showElements = (...DOMElements) => {
      for (const DOMElement of DOMElements) {
         DOMElement.removeAttribute('hidden');
      }
   };

   function makeInvisible(...DOMElements) {
      for (const DOMElement of DOMElements) {
         DOMElement.style.setProperty('opacity', 0, 'important');
      }
   }

   const successMessageResponse = (data = null, message = null) => {
      return {
         status: 'success',
         data,
         message
      };
   };

   const errorMessageResponse = (message, error = null) => {
      return {
         status: 'error',
         error,
         message
      };
   };

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

   async function sendChromeMessageToTab(type, data = null, tabId = null, tabs = []) {
      const cb = async (ifOfTab, tabs = []) => {
         return new Promise((resolve, reject) => {
            try {
               chrome.tabs.sendMessage(ifOfTab, {type, data}, response => {
                  try {
                     if (response?.status) {
                        if (response.status === 'success') {
                           resolve({...response.data, _tabs: tabs});
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
      };

      if (tabId) {
         return await cb(tabId, tabs);
      } else {
         tabs = await new Promise((resolve, reject) => {
            try {
               chrome.tabs.query({active: true, currentWindow: true}, resolve);
            } catch (e) {
               reject(e);
            }
         });

         return await cb(tabs[0].id, tabs);
      }
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

   async function getCurrentPageTabs() {
      return new Promise((resolve, reject) => {
         try {
            chrome.tabs.query({active: true, currentWindow: true}, resolve);
         } catch (e) {
            reject(e);
         }
      });
   }

   function detectLocalFileMode(pageFullUrl) {
      if (
         pageFullUrl &&
         pageFullUrl.startsWith('file:///') &&
         (pageFullUrl.endsWith('.html') || pageFullUrl.endsWith('.htm'))
      ) {
         return true;
      }

      return false;
   }

   return {
      createDOMElement,
      removeChildren,
      removeChildrenAndAppend,
      getErrorMessage,
      disableElements,
      enableElements,
      hideElements,
      showElements,
      successMessageResponse,
      errorMessageResponse,
      sendChromeMessage,
      sendChromeMessageToTab,
      getDomain,
      getCurrentPageTabs,
      detectLocalFileMode,
      makeInvisible
   };
};
