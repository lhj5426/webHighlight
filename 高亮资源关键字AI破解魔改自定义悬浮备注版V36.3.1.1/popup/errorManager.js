function sendBugReport(){
    // 错误报告功能已禁用 - 开发者已停止维护此扩展
    console.log('Bug report disabled - developer no longer maintains this extension');

    alert('错误报告功能已禁用\n\n开发者已停止维护此扩展，无法接收错误报告。');

    document.getElementById('sendErrorsIssue').value='';
    document.getElementById('sendErrorsEmail').value='';
    showHome();
}