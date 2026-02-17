import * as notifications from './notifications.js';

const Debug=false;
export function licenseCheck(){
    // 禁用许可证检查 - 永久使用
    Debug && console.log('license check disabled - permanent use');
    return;

    Debug && console.log('getting license details');
    const licenseUrl='https://api.highlightthis.net/api/licenseService/licensecheck';

    chrome.storage.local.get(['Settings'], (data) => {
        var settings=data.Settings;
        let currentDate = new Date();
        if(settings.license&&settings.license.type=='Temp'&&settings.license.validUntil<currentDate){
            Debug && console.log('license expired');
            notifications.notifyLicenseRevoked();
            chrome.storage.local.get(['Settings'], (data) => {
                var settings=data.Settings;
                settings.license={type: 'Free'};
                chrome.storage.local.set({['Settings']:settings});
            });
        }
        if(settings.license&&(settings.license.type=='500'||settings.license.type=='Unlimited')){
            const requestObject={
                licenseKey: settings.license.licenseKey,
                installId: settings.installId
            }
            fetch(licenseUrl
            , {
                method: "POST", // or 'PUT'
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(requestObject)
            }).then((response)=>{
                if (response.ok) {
                    return response.text();
                }   
                if (response.status==410){
                    // license expired
                    Debug && console.log('license expired');
                    notifications.notifyLicenseRevoked();
                    chrome.storage.local.get(['Settings'], (data) => {
                        var settings=data.Settings;
                        settings.license={type: 'Free'};
                        chrome.storage.local.set({['Settings']:settings});
                    });
                }
                throw new Error('Network response was not ok.');         
            }).then((licenseInfo)=>{
                Debug && console.log('license still valid', licenseInfo);
                licenseInfo=JSON.parse(licenseInfo);
                const validUntil=new Date(licenseInfo.validUntil).getTime();
           

                
                chrome.storage.local.get(['Settings'], (Settings) => {
                    var settings=data.Settings;
                    if(validUntil!==settings.license.validUntil||settings.license.type!==licenseInfo.product){
                        settings.license={type: licenseInfo.product, validUntil:validUntil, licenseKey: licenseInfo.licenseKey}
                        notifications.notifyLicenseUpdated(validUntil);
                        chrome.storage.local.set({['Settings']:settings});
                    }    
                });


            })
            .catch((err)=>{
                console.log(err);
            });
    

        } else {
            Debug && console.log('not licensed')
        }
        
    });

    
}
export function getAdConfig(){
    // 已禁用广告配置 - 永久移除
    Debug && console.log('ad config disabled - permanently removed');
    return;
}