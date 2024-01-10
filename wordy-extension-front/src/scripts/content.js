let isLocalFileMode = false;

const currentPageData = {
   langAttr: getLangAttr(),
   fullUrl: window.location.href
};

const {successMessageResponse, sendChromeMessage, ...utils} = useUtils();

document.addEventListener('destroy-feedback-data', async event => {
   try {
      const {feedbackDataId} = event.detail;

      if (feedbackDataId) {
         await sendChromeMessage('destroy-feedback-data', {feedbackDataId});
      }
   } catch (e) {
      console.error(e);
   }
});

chrome.runtime.onMessage.addListener((req, sender, res) => {
   if (req?.type === 'getCurrentPageData') {
      res(successMessageResponse(currentPageData));
   }
});

initHandler();

async function initHandler() {
   try {
      dispatchFeedbackData();

      isLocalFileMode = utils.detectLocalFileMode(currentPageData.fullUrl);

      if (!isLocalFileMode) {
         await initUrlsLibrary();
      }

      await populate();
   } catch (e) {
      console.error(e);
   }
}

async function populate() {
   try {
      await sendChromeMessage('populate', {ignoreNoTokenError: true});
   } catch (e) {
      console.error(e);
   }
}

function getLangAttr() {
   try {
      const langAttr = document.documentElement.lang || document.documentElement.getAttribute('xml:lang') || 'en';
      return langAttr.toLowerCase().replace(/\s+/g, '');
   } catch (e) {
      console.error(e);
      return 'en';
   }
}

async function dispatchFeedbackData() {
   try {
      if (location.href.includes('http://localhost:4200/')) {

         const feedbackData = await sendChromeMessage('get-feedback-data');

         document.dispatchEvent(new CustomEvent('init-feedback-data', {
            detail: {
               feedbackData
            }
         }));
      }
   } catch (e) {
      console.error(e);
   }
}

async function initUrlsLibrary() {
   try {
      await sendChromeMessage('init-urls-library', {fullUrl: currentPageData.fullUrl});
   } catch (e) {
      console.error(e);
   }
}
