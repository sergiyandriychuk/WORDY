chrome.runtime.onMessage.addListener((req, sender, res) => {
   if (req?.type === 'check-injection') {
      res(successMessageResponse());
   }
});
