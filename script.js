// 苹果设计风格 - 智能英文名生成器
class NameGenerator {
    constructor() {
        this.chineseNameInput = document.getElementById('chineseName');
        this.generateBtn = document.getElementById('generateBtn');
        this.resultSection = document.getElementById('resultSection');
        this.namesContainer = document.getElementById('namesContainer');
        this.errorSection = document.getElementById('errorSection');
        this.errorText = document.getElementById('errorText');
        this.regenerateBtn = document.getElementById('regenerateBtn');
        this.shareBtn = document.getElementById('shareBtn');
        this.statusMessage = document.getElementById('status-message');
        
        this.currentChineseName = '';
        this.init();
    }
    
    init() {
        this.generateBtn.addEventListener('click', () => this.generateNames());
        this.regenerateBtn.addEventListener('click', () => this.regenerateNames());
        this.shareBtn.addEventListener('click', () => this.shareResults());
        
        this.chineseNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.generateNames();
            }
        });
        
        this.chineseNameInput.addEventListener('input', () => {
            this.updateInputHint();
        });
        
        this.chineseNameInput.addEventListener('focus', () => {
            this.chineseNameInput.parentElement.classList.add('focused');
        });
        
        this.chineseNameInput.addEventListener('blur', () => {
            this.chineseNameInput.parentElement.classList.remove('focused');
        });
        
        // 初始化屏幕阅读器状态
        this.updateScreenReaderStatus('页面加载完成，请输入中文名字开始生成英文名');
        
        // 添加动画效果
        this.addAnimationEffects();
    }
    
    validateInput(name) {
        if (!name || name.trim() === '') {
            return '请输入您的中文名字';
        }
        
        const chineseRegex = /^[\u4e00-\u9fa5]{2,4}$/;
        if (!chineseRegex.test(name)) {
            return '请输入2-4个中文字符';
        }
        
        return null;
    }
    
    updateInputHint() {
        const name = this.chineseNameInput.value.trim();
        const hint = document.getElementById('name-hint');
        
        if (name.length === 0) {
            hint.textContent = '支持2-4个中文字符';
            hint.style.color = 'var(--text-secondary)';
        } else if (name.length < 2) {
            hint.textContent = '还需要输入更多字符';
            hint.style.color = '#FF9500';
        } else if (name.length > 4) {
            hint.textContent = '字符数超出限制';
            hint.style.color = '#FF3B30';
        } else {
            hint.textContent = '格式正确，可以生成英文名';
            hint.style.color = '#34C759';
        }
    }
    
    async generateNames() {
        const chineseName = this.chineseNameInput.value.trim();
        const validationError = this.validateInput(chineseName);
        
        if (validationError) {
            this.showError(validationError);
            this.updateScreenReaderStatus(`输入验证失败：${validationError}`);
            return;
        }
        
        this.currentChineseName = chineseName;
        this.showLoading();
        this.hideError();
        this.hideResults();
        this.updateScreenReaderStatus(`正在为${chineseName}生成英文名，请稍候...`);
        
        try {
            const response = await fetch('/api/generate-names', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ chineseName })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            if (data.names && data.names.length > 0) {
                this.displayNames(data.names);
                this.updateScreenReaderStatus(`为${chineseName}生成了${data.names.length}个英文名，请查看结果`);
            } else {
                throw new Error('未生成有效的英文名');
            }
            
        } catch (error) {
            console.error('生成英文名时出错:', error);
            const errorMessage = error.message.includes('timeout') ? 
                '生成超时，请检查网络连接后重试' : 
                '生成英文名时出现错误，请稍后重试';
            this.showError(errorMessage);
            this.updateScreenReaderStatus(`生成英文名时出错：${errorMessage}`);
        } finally {
            this.hideLoading();
        }
    }
    
    async regenerateNames() {
        if (!this.currentChineseName) {
            this.showError('请先输入中文名字');
            return;
        }
        
        this.showLoading();
        this.hideError();
        this.hideResults();
        this.updateScreenReaderStatus(`正在重新为${this.currentChineseName}生成英文名...`);
        
        try {
            const response = await fetch('/api/generate-names', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ chineseName: this.currentChineseName })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            if (data.names && data.names.length > 0) {
                this.displayNames(data.names);
                this.updateScreenReaderStatus(`重新为${this.currentChineseName}生成了${data.names.length}个英文名`);
            } else {
                throw new Error('未生成有效的英文名');
            }
            
        } catch (error) {
            console.error('重新生成英文名时出错:', error);
            this.showError('重新生成英文名时出现错误，请稍后重试');
            this.updateScreenReaderStatus('重新生成英文名时出错');
        } finally {
            this.hideLoading();
        }
    }
    
    shareResults() {
        if (!this.currentChineseName || this.namesContainer.children.length === 0) {
            this.showError('没有可分享的结果');
            return;
        }
        
        const names = Array.from(this.namesContainer.children).map(card => {
            const name = card.querySelector('.english-name').textContent;
            const meaning = card.querySelector('.meaning-text').textContent;
            return `${name} - ${meaning}`;
        }).join('\n');
        
        const shareText = `我为${this.currentChineseName}生成的英文名：\n${names}\n\n来自智能英文名生成器`;
        
        if (navigator.share) {
            navigator.share({
                title: '智能英文名生成器',
                text: shareText,
                url: window.location.href
            }).catch(() => {
                this.copyToClipboard(shareText);
            });
        } else {
            this.copyToClipboard(shareText);
        }
    }
    
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showTemporaryMessage('结果已复制到剪贴板');
            this.updateScreenReaderStatus('结果已复制到剪贴板');
        } catch (err) {
            this.showError('复制失败，请手动复制结果');
        }
    }
    
    showLoading() {
        this.generateBtn.disabled = true;
        this.regenerateBtn.disabled = true;
        this.shareBtn.disabled = true;
        
        const btnText = this.generateBtn.querySelector('.btn-text');
        const loadingSpinner = this.generateBtn.querySelector('.loading-spinner');
        
        btnText.style.display = 'none';
        loadingSpinner.style.display = 'flex';
    }
    
    hideLoading() {
        this.generateBtn.disabled = false;
        this.regenerateBtn.disabled = false;
        this.shareBtn.disabled = false;
        
        const btnText = this.generateBtn.querySelector('.btn-text');
        const loadingSpinner = this.generateBtn.querySelector('.loading-spinner');
        
        btnText.style.display = 'inline';
        loadingSpinner.style.display = 'none';
    }
    
    displayNames(names) {
        this.namesContainer.innerHTML = '';
        
        names.forEach((nameData, index) => {
            const nameCard = this.createNameCard(nameData, index + 1);
            this.namesContainer.appendChild(nameCard);
            
            // 添加延迟动画效果
            setTimeout(() => {
                nameCard.style.opacity = '1';
                nameCard.style.transform = 'translateY(0)';
            }, index * 200);
        });
        
        this.resultSection.style.display = 'block';
        
        // 平滑滚动到结果区域
        this.resultSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
    
    createNameCard(nameData, index) {
        const card = document.createElement('div');
        card.className = 'name-card';
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.5s ease-out';
        card.setAttribute('role', 'listitem');
        card.setAttribute('aria-label', `英文名选项 ${index}`);
        
        const icons = ['🌟', '✨', '🎯'];
        
        card.innerHTML = `
            <div class="name-header">
                <span class="name-icon">${icons[index - 1] || '💫'}</span>
                <div class="name-text">
                    <div class="english-name">${this.escapeHtml(nameData.englishName)}</div>
                    <div class="name-index">推荐名 ${index}</div>
                </div>
            </div>
            
            <div class="meaning-section">
                <h4>📖 中文寓意：</h4>
                <div class="meaning-text">${this.escapeHtml(nameData.chineseMeaning)}</div>
            </div>
            
            <div class="meaning-section">
                <h4>🌍 英文寓意：</h4>
                <div class="meaning-text">${this.escapeHtml(nameData.englishMeaning)}</div>
            </div>
            
            <div class="meaning-section">
                <h4>😄 幽默说明：</h4>
                <div class="meaning-text">${this.escapeHtml(nameData.humorNote)}</div>
            </div>
        `;
        
        return card;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showError(message) {
        this.errorText.textContent = message;
        this.errorSection.style.display = 'block';
        this.hideResults();
        
        // 添加错误动画
        this.errorSection.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            this.errorSection.style.animation = '';
        }, 500);
        
        // 平滑滚动到错误区域
        this.errorSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    hideError() {
        this.errorSection.style.display = 'none';
    }
    
    hideResults() {
        this.resultSection.style.display = 'none';
    }
    
    showTemporaryMessage(message) {
        const tempMessage = document.createElement('div');
        tempMessage.className = 'temporary-message';
        tempMessage.textContent = message;
        tempMessage.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--primary);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(tempMessage);
        
        setTimeout(() => {
            tempMessage.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (tempMessage.parentNode) {
                    tempMessage.parentNode.removeChild(tempMessage);
                }
            }, 300);
        }, 2000);
    }
    
    updateScreenReaderStatus(message) {
        this.statusMessage.textContent = message;
    }
    
    addAnimationEffects() {
        // 为名字卡片添加悬停效果
        document.addEventListener('mouseover', (e) => {
            if (e.target.closest('.name-card')) {
                const card = e.target.closest('.name-card');
                card.style.transform = 'translateY(-5px) scale(1.02)';
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target.closest('.name-card')) {
                const card = e.target.closest('.name-card');
                card.style.transform = 'translateY(0) scale(1)';
            }
        });
    }
}

// 添加额外的CSS动画
const style = document.createElement('style');
style.textContent = `
    body {
        opacity: 0;
        transition: opacity 0.5s ease-in-out;
    }
    
    .name-card {
        transition: all 0.3s ease;
    }
    
    @keyframes bounceIn {
        0% { transform: scale(0.3); opacity: 0; }
        50% { transform: scale(1.05); }
        70% { transform: scale(0.9); }
        100% { transform: scale(1); opacity: 1; }
    }
    
    .name-card {
        animation: bounceIn 0.6s ease-out;
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .input-wrapper.focused input {
        border-color: var(--primary) !important;
        box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1) !important;
    }
    
    .temporary-message {
        font-family: inherit;
        font-weight: 500;
    }
`;
document.head.appendChild(style);

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    const nameGenerator = new NameGenerator();
    
    // 添加一些有趣的页面加载效果
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});