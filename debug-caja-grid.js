// ========================================
// CAJA PAGE GRID LAYOUT DEBUGGER
// ========================================
// Paste this entire script into the browser console
// when viewing http://localhost:3000/caja
// ========================================

console.clear();
console.log('🔍 CAJA LAYOUT DEBUGGER\n');

// Get viewport info
const viewportWidth = window.innerWidth;
const viewportHeight = window.innerHeight;
const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);

console.log('📐 VIEWPORT INFO:');
console.log(`  Width: ${viewportWidth}px`);
console.log(`  Height: ${viewportHeight}px`);
console.log(`  Root font-size: ${rootFontSize}px (1rem = ${rootFontSize}px)`);
console.log(`  XL breakpoint: 1280px`);
console.log(`  Status: ${viewportWidth >= 1280 ? '✅ Above XL (grid should be active)' : '❌ Below XL (flex-col active)'}\n`);

// Find the grid container
const gridContainer = document.querySelector('.xl\\:grid');

if (!gridContainer) {
    console.error('❌ GRID CONTAINER NOT FOUND');
    console.log('Looking for element with class "xl:grid"...');
    
    // Search for alternatives
    const allGridElements = document.querySelectorAll('[class*="grid"]');
    console.log(`\nFound ${allGridElements.length} elements with "grid" in their class:`);
    allGridElements.forEach((el, i) => {
        console.log(`  ${i + 1}. ${el.className}`);
    });
} else {
    console.log('✅ GRID CONTAINER FOUND\n');
    
    // Get computed styles
    const styles = getComputedStyle(gridContainer);
    const rect = gridContainer.getBoundingClientRect();
    
    console.log('🎨 GRID CONTAINER STYLES:');
    console.log(`  Classes: ${gridContainer.className}`);
    console.log(`  Display: ${styles.display}`);
    console.log(`  Grid Template Columns: ${styles.gridTemplateColumns}`);
    console.log(`  Gap: ${styles.gap}`);
    console.log(`  Width: ${rect.width.toFixed(2)}px (${(rect.width / rootFontSize).toFixed(2)}rem)`);
    console.log(`  Height: ${rect.height.toFixed(2)}px (${(rect.height / rootFontSize).toFixed(2)}rem)`);
    console.log(`  Position: left=${rect.left.toFixed(0)}px, top=${rect.top.toFixed(0)}px\n`);
    
    // Check children
    const children = Array.from(gridContainer.children);
    console.log(`👶 GRID CHILDREN: ${children.length} found\n`);
    
    children.forEach((child, index) => {
        const childRect = child.getBoundingClientRect();
        const childStyles = getComputedStyle(child);
        
        console.log(`  📦 Child ${index + 1}:`);
        console.log(`    Classes: ${child.className}`);
        console.log(`    Width: ${childRect.width.toFixed(2)}px (${(childRect.width / rootFontSize).toFixed(2)}rem)`);
        console.log(`    Height: ${childRect.height.toFixed(2)}px (${(childRect.height / rootFontSize).toFixed(2)}rem)`);
        console.log(`    Display: ${childStyles.display}`);
        console.log(`    Position: left=${childRect.left.toFixed(0)}px, top=${childRect.top.toFixed(0)}px`);
        
        // Try to identify which card this is
        const summaryCard = child.querySelector('[class*="CashSummaryCard"]') || child.textContent.includes('Cobrado vs Facturado');
        const trendCard = child.querySelector('[class*="CashTrendCard"]') || child.textContent.includes('Facturado:');
        
        if (summaryCard) console.log(`    🎯 Contains: CashSummaryCard`);
        if (trendCard) console.log(`    📈 Contains: CashTrendCard`);
        console.log('');
    });
    
    // Check if cards are side-by-side or stacked
    if (children.length >= 2) {
        const child1Rect = children[0].getBoundingClientRect();
        const child2Rect = children[1].getBoundingClientRect();
        
        // Check if second card starts after first card ends (with some tolerance)
        const isSideBySide = child2Rect.left > child1Rect.right - 10;
        
        console.log('📊 LAYOUT ARRANGEMENT:');
        console.log(`  Card 1 bounds: left=${child1Rect.left.toFixed(0)}px, right=${child1Rect.right.toFixed(0)}px`);
        console.log(`  Card 2 bounds: left=${child2Rect.left.toFixed(0)}px, right=${child2Rect.right.toFixed(0)}px`);
        console.log(`  Horizontal gap: ${(child2Rect.left - child1Rect.right).toFixed(0)}px`);
        console.log(`  Vertical offset: ${Math.abs(child1Rect.top - child2Rect.top).toFixed(0)}px\n`);
        
        if (isSideBySide) {
            console.log('  ✅ LAYOUT: SIDE-BY-SIDE (Grid is working correctly)');
        } else {
            console.log('  ⚠️ LAYOUT: STACKED VERTICALLY (Grid may not be active)');
            console.log('  Possible causes:');
            console.log('    - Viewport width below xl breakpoint');
            console.log('    - Grid display not applied');
            console.log('    - CSS specificity issue');
            console.log('    - Flex-col overriding grid');
        }
    }
    
    // Check for potential CSS conflicts
    console.log('\n🔧 CSS CONFLICT CHECK:');
    const hasFlexCol = gridContainer.classList.contains('flex-col');
    const hasFlex = gridContainer.classList.contains('flex');
    console.log(`  Has "flex" class: ${hasFlex ? '⚠️ Yes (may conflict with grid)' : '✅ No'}`);
    console.log(`  Has "flex-col" class: ${hasFlexCol ? '⚠️ Yes (may override grid)' : '✅ No'}`);
    
    // Check computed display value at different breakpoints
    console.log('\n💡 EXPECTED BEHAVIOR:');
    console.log('  < 1280px: display should be "flex" (flex-col active)');
    console.log('  ≥ 1280px: display should be "grid" (xl:grid active)');
    console.log(`  Current: display is "${styles.display}"`);
    
    if (viewportWidth >= 1280 && styles.display !== 'grid') {
        console.log('\n⚠️ WARNING: Viewport is above xl breakpoint but display is not "grid"!');
        console.log('This suggests the xl:grid class is not being applied correctly.');
    }
}

// Highlight the grid container visually
if (gridContainer) {
    console.log('\n🎨 Visual highlight added to grid container (red border)');
    gridContainer.style.outline = '3px solid red';
    gridContainer.style.outlineOffset = '-3px';
    
    // Highlight children
    Array.from(gridContainer.children).forEach((child, i) => {
        child.style.outline = `2px solid ${i === 0 ? 'blue' : 'green'}`;
        child.style.outlineOffset = '-2px';
    });
    
    console.log('🎨 Children highlighted: Card 1 (blue), Card 2 (green)');
    console.log('\n💡 To remove highlights, refresh the page');
}

console.log('\n========================================');
console.log('Debug complete! Check the visual highlights on the page.');
console.log('========================================');
