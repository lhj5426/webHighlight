// 许可证服务已停用 - 开发者已停止维护
const licenseEndpoint=''; // 已禁用


function requestLicense(email, duration, amount, companyDetails,callback){
    // 许可证服务已停用
    console.log('License service disabled - developer no longer maintains this extension');
    callback && callback(false);
}

function checkLicense(callback){
    // 许可证服务已停用
    console.log('License service disabled - developer no longer maintains this extension');
}

function checkEnteredLicenseKey(licenseKey, callback){
    // 许可证服务已停用
    console.log('License service disabled - developer no longer maintains this extension');
    callback(false);
}


function registerLicense(newLicense, mode){
    HighlightsData.License=newLicense;
    localStorage["HighlightsData"] = JSON.stringify(HighlightsData);
    if(mode=='new'){
        notifyLicenseRegistered(newLicense.validUntil);
    }
    else{
        notifyLicenseUpdated(newLicense.validUntil);

    }
}

function revokeLicense(){
    delete HighlightsData.License;
    localStorage["HighlightsData"] = JSON.stringify(HighlightsData);
    notifyLicenseRevoked();
}

function getLicense(){
    return HighlightsData.License;
}

function license(){
    /*var registeredLicense=getLicense();
    var now = new Date();

    if (registeredLicense){
        var validUntil=new Date(registeredLicense.validUntil)

        if(validUntil>now) {
            return "premium";
        }
    }*/
    return "free";
}

