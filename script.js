document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.projects-container');
    const wrapper = document.querySelector('.projects-wrapper');
    const scrollLeftBtn = document.getElementById('scrollLeft');
    const scrollRightBtn = document.getElementById('scrollRight');

    if (!container || !wrapper || !scrollLeftBtn || !scrollRightBtn) {
        console.error('無法找到必要的 DOM 元素');
        return;
    }

    console.log('DOM 元素已找到');

    let itemWidth = container.children[0].offsetWidth;
    let itemsPerScreen = Math.floor(wrapper.offsetWidth / itemWidth);
    let currentIndex = 0;

    function updateItemWidth() {
        itemWidth = container.children[0].offsetWidth;
        itemsPerScreen = Math.floor(wrapper.offsetWidth / itemWidth);
        console.log('更新項目寬度:', itemWidth, '每屏項目數:', itemsPerScreen);
    }

    function scrollProjects(direction) {
        console.log('Scrolling', direction);
        updateItemWidth();
        if (direction === 'left') {
            currentIndex = Math.max(0, currentIndex - 1);
        } else {
            currentIndex = Math.min(container.children.length - itemsPerScreen, currentIndex + 1);
        }
        const scrollAmount = currentIndex * itemWidth;
        console.log('滾動到:', scrollAmount);
        container.style.transform = `translateX(-${scrollAmount}px)`;
        updateScrollButtons();
    }

    function handleLeftClick() {
        console.log('左按鈕被點擊');
        scrollProjects('left');
    }

    function handleRightClick() {
        console.log('右按鈕被點擊');
        scrollProjects('right');
    }

    scrollLeftBtn.addEventListener('click', handleLeftClick);
    scrollRightBtn.addEventListener('click', handleRightClick);

    console.log('事件監聽器已添加');

    function updateScrollButtons() {
        const canScrollLeft = currentIndex > 0;
        const canScrollRight = currentIndex < container.children.length - itemsPerScreen;
        
        scrollLeftBtn.classList.toggle('disabled', !canScrollLeft);
        scrollRightBtn.classList.toggle('disabled', !canScrollRight);
        
        console.log('更新按鈕狀態:', '可左滾:', canScrollLeft, '可右滾:', canScrollRight);
    }

    window.addEventListener('resize', () => {
        console.log('窗口大小改變');
        updateItemWidth();
        scrollProjects('left'); // 重置到第一個項目
    });

    updateScrollButtons();
    console.log('滾動功能初始化完成');
});

// 導出函數以便測試
module.exports = { scrollProjects };
