// ==UserScript==
// @name         飞书妙记增强脚本
// @name:en      Lark-Minutes-Enhancer
// @namespace    https://github.com/tataboxer/Lark-Minutes-Enhancer 
// @version      1.5
// @description  移除飞书妙记额度遮罩、自动展开纪要、一键复制为Markdown格式。
// @description:en Remove Lark Minutes quota mask, auto-expand chapters, and copy summary as Markdown.
// @author       tataboxer
// @match        https://larkcommunity.feishu.cn/minutes/*
// @match        https://ufpohmwnol.feishu.cn/minutes/*  
// @grant        GM_addStyle
// @run-at       document-end
// @icon         https://raw.githubusercontent.com/tataboxer/Lark-Minutes-Enhancer/main/icon.png
// @homepageURL  https://github.com/tataboxcer/Lark-Minutes-Enhancer   // 脚本主页，后面会创建
// @supportURL   https://github.com/tataboxer/Lark-Minutes-Enhancer/issues // 用户反馈问题的地址
// @downloadURL  https://greasyfork.org/scripts/你的脚本ID/code/你的脚本名.user.js // Greasy Fork会自动生成，发布后可以填上
// @updateURL    https://greasyfork.org/scripts/你的脚本ID/code/你的脚本名.meta.js  // Greasy Fork会自动生成，发布后可以填上
// ==/UserScript==

/**
 * 飞书妙记增强脚本主函数
 * 主要功能：
 * 1. 移除飞书妙记的额度限制遮罩
 * 2. 自动展开纪要内容
 * 3. 提供一键复制为Markdown格式功能
 */
(function() {
    'use strict';
    // ... (v1.3的全部功能代码保持不变) ...
    /**
 * [功能 F01 & F02] 移除遮罩 & 自动展开
 * 通过注入CSS样式实现：
 * 1. 隐藏额度超限的遮罩层
 * 2. 定义浮动复制按钮的样式
 */
    GM_addStyle(`
        div.ai-quota-exceed-mask, div.linear-gradient-content { display: none !important; }
        #floating-copy-button {
            position: absolute; top: 15px; right: 20px; z-index: 9999;
            padding: 6px 12px; font-size: 14px; font-weight: bold; color: #fff;
            background-color: #007AFF; border: none; border-radius: 6px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2); cursor: pointer;
            transition: all 0.2s ease-in-out;
        }
        #floating-copy-button:hover { background-color: #0056b3; transform: scale(1.05); }
        #floating-copy-button.success { background-color: #28a745; }
        #floating-copy-button.error { background-color: #dc3545; }
    `);

    /**
 * 自动展开所有章节内容
 * 查找页面中的"展开"按钮并自动点击
 * 如果按钮存在且未被点击过(data-expanded属性为false)，则触发点击事件
 */
function expandAllChapters() {
        const expandButton = document.querySelector('div.ai-summary-content-editable-expand-button-wrapper > button:not([data-expanded="true"])');
        if (expandButton && expandButton.textContent.includes('展开')) {
            expandButton.click();
            expandButton.setAttribute('data-expanded', 'true');
            console.log('[飞书妙记增强 v1.4]：功能F02 -> 已自动展开纪要。');
        }
    }

    /**
 * [新增功能] HTML到Markdown转换器
 * 将HTML格式的纪要内容转换为Markdown格式
 * @param {HTMLElement} element - 包含纪要内容的DOM元素
 * @returns {string} 转换后的Markdown文本
 */
function htmlToMarkdown(element) {
        let markdownText = '';

        function processNode(node, listLevel = 0) {
            if (node.nodeType === Node.TEXT_NODE) {
                markdownText += node.textContent;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                let prefix = '';
                let suffix = '';
                let children = Array.from(node.childNodes);

                switch (node.tagName) {
                    case 'DIV':
                        if (!node.classList.contains('list-div')) {
                            suffix = '\n';
                        }
                        break;
                    case 'UL':
                    case 'OL':
                        children.forEach(child => processNode(child, listLevel + 1));
                        return;
                    case 'LI':
                        prefix = '  '.repeat(listLevel - 1) + '- ';
                        suffix = '\n';
                        break;
                    case 'SPAN':
                        if (node.style.fontWeight === 'bold' || getComputedStyle(node).fontWeight === '700' || getComputedStyle(node).fontWeight === 'bold') {
                           prefix = '**';
                           suffix = '**';
                        }
                        if(node.hasAttribute('data-enter')) {
                            return;
                        }
                        break;
                }

                markdownText += prefix;
                children.forEach(child => processNode(child, listLevel));
                markdownText += suffix;
            }
        }
        processNode(element);
        return markdownText.replace(/\n\s*\n/g, '\n').trim();
    }

    // --- [功能 F03 - 已升级] 添加支持Markdown的悬浮复制按钮 ---
    function addFloatingCopyButton() {
        const rightPanel = document.querySelector('div.detail-right-content');
        if (rightPanel && !document.getElementById('floating-copy-button')) {
            const copyButton = document.createElement('button');
            copyButton.id = 'floating-copy-button';
            copyButton.textContent = '复制为MD';

            copyButton.addEventListener('click', () => {
                const contentWrapper = document.querySelector('.minutes-editable.ai-summary-content-editable');
                if (contentWrapper) {
                    const markdownContent = htmlToMarkdown(contentWrapper);
                    navigator.clipboard.writeText(markdownContent).then(() => {
                        console.log('[飞书妙记增强 v1.4]：功能F03 -> Markdown纪要已成功复制。');
                        copyButton.textContent = '复制成功!';
                        copyButton.className = 'success';
                        setTimeout(() => { copyButton.textContent = '复制为MD'; copyButton.className = ''; }, 2000);
                    }).catch(err => {
                        console.error('[飞书妙记增强 v1.4]：功能F03 -> 复制失败:', err);
                        copyButton.textContent = '复制失败';
                        copyButton.className = 'error';
                        setTimeout(() => { copyButton.textContent = '复制为MD'; copyButton.className = ''; }, 2000);
                    });
                }
            });

            rightPanel.style.position = 'relative';
            rightPanel.appendChild(copyButton);
            console.log('[飞书妙记增强 v1.4]：功能F03 -> 悬浮“复制为MD”按钮已成功添加。');
        }
    }

    // --- 页面动态内容加载监控 ---
    const observer = new MutationObserver(() => {
        expandAllChapters();
        addFloatingCopyButton();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    console.log('[飞书妙记增强 v1.4]：脚本已启动，祝您使用愉快！');
})();
