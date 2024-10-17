require('@testing-library/jest-dom');
const { fireEvent } = require('@testing-library/dom');

// 模擬 DOM 結構
document.body.innerHTML = `
    <div class="projects-wrapper">
        <button class="scroll-btn scroll-left" id="scrollLeft">&lt;</button>
        <div class="projects-container">
            <div class="project-item">項目 1</div>
            <div class="project-item">項目 2</div>
            <div class="project-item">項目 3</div>
        </div>
        <button class="scroll-btn scroll-right" id="scrollRight">&gt;</button>
    </div>
`;

// 導入實際的 JavaScript 文件
const script = require('./script.js');

describe('Project Scroll Functionality', () => {
    let container, leftBtn, rightBtn;

    beforeEach(() => {
        container = document.querySelector('.projects-container');
        leftBtn = document.getElementById('scrollLeft');
        rightBtn = document.getElementById('scrollRight');

        // 模擬滾動容器的尺寸和內容
        Object.defineProperty(container, 'clientWidth', { value: 300 });
        Object.defineProperty(container, 'scrollWidth', { value: 900 });
        container.scrollLeft = 0;
    });

    test('Right button scrolls content to the right', () => {
        fireEvent.click(rightBtn);
        expect(container.scrollLeft).toBeGreaterThan(0);
    });

    test('Left button scrolls content to the left', () => {
        container.scrollLeft = 300;
        fireEvent.click(leftBtn);
        expect(container.scrollLeft).toBeLessThan(300);
    });

    test('Left button is hidden when scrolled to the start', () => {
        container.scrollLeft = 0;
        fireEvent.scroll(container);
        expect(leftBtn).not.toBeVisible();
    });

    test('Right button is hidden when scrolled to the end', () => {
        container.scrollLeft = 600; // 假設這是最右邊
        fireEvent.scroll(container);
        expect(rightBtn).not.toBeVisible();
    });

    test('Both buttons are visible when in the middle of content', () => {
        container.scrollLeft = 300;
        fireEvent.scroll(container);
        expect(leftBtn).toBeVisible();
        expect(rightBtn).toBeVisible();
    });
});
