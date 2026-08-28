/**
 * Team Wiki - Vanilla JavaScript Implementation
 * Data source: wiki-data.json
 */

(function () {
  'use strict';

  // Category Icon & Theme Mapping
  const CATEGORY_THEMES = {
    people: {
      icon: '👥',
      colorVar: 'cat-people'
    },
    'expense-purchase': {
      icon: '💳',
      colorVar: 'cat-expense'
    },
    'project-collaboration': {
      icon: '🚀',
      colorVar: 'cat-project'
    },
    'brand-assets': {
      icon: '🎨',
      colorVar: 'cat-brand'
    },
    'customer-operations': {
      icon: '🎧',
      colorVar: 'cat-customer'
    }
  };

  // State
  let wikiData = null;
  let currentSearchQuery = '';
  let selectedCategory = 'all';

  // DOM Elements
  const noticeText = document.getElementById('noticeText');
  const globalUpdatedAt = document.getElementById('globalUpdatedAt');
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const categoryTabs = document.getElementById('categoryTabs');
  const wikiSection = document.getElementById('wikiSection');
  const searchStats = document.getElementById('searchStats');
  const statsText = document.getElementById('statsText');
  const resetFilterBtn = document.getElementById('resetFilterBtn');
  const emptyState = document.getElementById('emptyState');
  const emptyKeywordText = document.getElementById('emptyKeywordText');
  const emptyResetBtn = document.getElementById('emptyResetBtn');
  const supportMessage = document.getElementById('supportMessage');
  const supportContact = document.getElementById('supportContact');
  const dataVersion = document.getElementById('dataVersion');

  // Initialize
  async function init() {
    try {
      const response = await fetch('./wiki-data.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      wikiData = await response.json();
      renderNoticeAndMeta();
      renderCategoryTabs();
      renderContent();
      setupEventListeners();
    } catch (error) {
      console.error('Failed to load wiki-data.json:', error);
      noticeText.textContent = '위키 데이터를 불러오는데 실패했습니다. 페이지를 새로고침하거나 관리자에게 문의하세요.';
      wikiSection.innerHTML = `
        <div class="empty-state" style="display: block;">
          <h3 class="empty-title">데이터를 불러올 수 없습니다</h3>
          <p class="empty-desc">wiki-data.json 파일을 찾을 수 없거나 파일 형식이 잘못되었습니다.</p>
        </div>
      `;
    }
  }

  // Render Header Notice and Support Meta
  function renderNoticeAndMeta() {
    if (!wikiData) return;

    if (wikiData.notice) {
      noticeText.textContent = wikiData.notice;
    }
    if (wikiData.updatedAt) {
      globalUpdatedAt.textContent = `기준일: ${wikiData.updatedAt}`;
    }
    if (wikiData.support) {
      if (wikiData.support.message) {
        supportMessage.textContent = wikiData.support.message;
      }
      if (wikiData.support.contact) {
        supportContact.textContent = wikiData.support.contact;
      }
    }
    if (wikiData.version) {
      dataVersion.textContent = `v${wikiData.version}.0`;
    }
  }

  // Render Category Quick Tabs
  function renderCategoryTabs() {
    if (!wikiData || !wikiData.categories) return;

    const totalCount = wikiData.categories.reduce((acc, cat) => acc + (cat.items ? cat.items.length : 0), 0);

    let html = `
      <button type="button" class="tab-chip ${selectedCategory === 'all' ? 'active' : ''}" data-category="all">
        <span>전체 보기</span>
        <span class="tab-count">${totalCount}</span>
      </button>
    `;

    wikiData.categories.forEach(category => {
      const theme = CATEGORY_THEMES[category.id] || { icon: '📁' };
      const count = category.items ? category.items.length : 0;
      const isActive = selectedCategory === category.id;

      html += `
        <button type="button" class="tab-chip ${isActive ? 'active' : ''}" data-category="${escapeHtml(category.id)}">
          <span>${theme.icon} ${escapeHtml(category.name)}</span>
          <span class="tab-count">${count}</span>
        </button>
      `;
    });

    categoryTabs.innerHTML = html;
  }

  // Filter Data based on search query & selected category
  function getFilteredData() {
    if (!wikiData || !wikiData.categories) return { categories: [], totalMatchingItems: 0 };

    const query = currentSearchQuery.trim().toLowerCase();
    let totalMatchingItems = 0;

    const categories = wikiData.categories
      .filter(category => {
        if (selectedCategory === 'all') return true;
        return category.id === selectedCategory;
      })
      .map(category => {
        const categoryNameMatches = category.name.toLowerCase().includes(query);

        const filteredItems = (category.items || []).filter(item => {
          if (!query) return true;
          if (categoryNameMatches) return true; // 카테고리명이 일치하면 하위 항목 모두 포함

          const titleMatches = (item.title || '').toLowerCase().includes(query);
          const descMatches = (item.description || '').toLowerCase().includes(query);
          const contactMatches = (item.contact || '').toLowerCase().includes(query);

          return titleMatches || descMatches || contactMatches;
        });

        totalMatchingItems += filteredItems.length;

        return {
          ...category,
          items: filteredItems
        };
      })
      .filter(category => category.items.length > 0);

    return { categories, totalMatchingItems };
  }

  // Highlight Text with <mark>
  function highlightText(text, query) {
    if (!text) return '';
    if (!query) return escapeHtml(text);

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return escapeHtml(text).replace(regex, '<mark>$1</mark>');
  }

  // Escape HTML to prevent XSS
  function escapeHtml(string) {
    if (!string) return '';
    return String(string)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Render Main Content (Categories & Cards)
  function renderContent() {
    const { categories, totalMatchingItems } = getFilteredData();
    const query = currentSearchQuery.trim();

    // Toggle Clear Search Button
    if (query.length > 0) {
      clearSearchBtn.hidden = false;
    } else {
      clearSearchBtn.hidden = true;
    }

    // Toggle Search Stats
    if (query.length > 0 || selectedCategory !== 'all') {
      searchStats.hidden = false;
      let statusMsg = '';
      if (query.length > 0 && selectedCategory !== 'all') {
        const catObj = wikiData.categories.find(c => c.id === selectedCategory);
        statusMsg = `<strong>"${escapeHtml(catObj ? catObj.name : '')}"</strong> 카테고리 내 <strong>"${escapeHtml(query)}"</strong> 검색 결과: 총 <strong>${totalMatchingItems}</strong>개`;
      } else if (query.length > 0) {
        statusMsg = `<strong>"${escapeHtml(query)}"</strong> 검색 결과: 총 <strong>${totalMatchingItems}</strong>개의 문서/도구`;
      } else {
        const catObj = wikiData.categories.find(c => c.id === selectedCategory);
        statusMsg = `<strong>"${escapeHtml(catObj ? catObj.name : '')}"</strong> 카테고리 항목: 총 <strong>${totalMatchingItems}</strong>개`;
      }
      statsText.innerHTML = statusMsg;
    } else {
      searchStats.hidden = true;
    }

    // Handle Empty State
    if (categories.length === 0 || totalMatchingItems === 0) {
      wikiSection.innerHTML = '';
      emptyState.hidden = false;
      if (query) {
        emptyKeywordText.textContent = `"${query}"에 대한 검색 결과가 없습니다. 다른 검색어를 입력해 보세요.`;
      } else {
        emptyKeywordText.textContent = '선택한 카테고리에 표시할 항목이 없습니다.';
      }
      return;
    }

    emptyState.hidden = true;

    // Render Categories & Cards Grid
    let html = '';
    categories.forEach(category => {
      const theme = CATEGORY_THEMES[category.id] || { icon: '📁' };

      html += `
        <article class="wiki-category-group" id="cat-${escapeHtml(category.id)}">
          <header class="category-header">
            <div class="category-header-title">
              <div class="category-icon-wrapper" aria-hidden="true">${theme.icon}</div>
              <h2 class="category-title">${highlightText(category.name, query)}</h2>
              <span class="category-badge-count">${category.items.length}</span>
            </div>
          </header>

          <div class="cards-grid">
            ${category.items.map(item => `
              <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="wiki-card" aria-label="${escapeHtml(item.title)} 열기 (새 창)">
                <div class="card-main">
                  <div class="card-top">
                    <h3 class="card-title">${highlightText(item.title, query)}</h3>
                    <span class="card-link-action" aria-hidden="true">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M7 17 17 7"></path>
                        <path d="M7 7h10v10"></path>
                      </svg>
                    </span>
                  </div>
                  <p class="card-description">${highlightText(item.description, query)}</p>
                </div>

                <div class="card-meta">
                  <span class="contact-pill">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    ${highlightText(item.contact, query)}
                  </span>
                  <time class="card-date" datetime="${escapeHtml(item.updatedAt)}">
                    ${escapeHtml(item.updatedAt)} 업데이트
                  </time>
                </div>
              </a>
            `).join('')}
          </div>
        </article>
      `;
    });

    wikiSection.innerHTML = html;
  }

  // Setup Event Listeners
  function setupEventListeners() {
    // Search input handler
    searchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value;
      renderContent();
    });

    // Clear search button
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      currentSearchQuery = '';
      renderContent();
      searchInput.focus();
    });

    // Category Tabs click
    categoryTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.tab-chip');
      if (!btn) return;

      const cat = btn.dataset.category;
      if (selectedCategory === cat) return;

      selectedCategory = cat;

      // Update active tab class
      categoryTabs.querySelectorAll('.tab-chip').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');

      renderContent();
    });

    // Reset filters
    const resetAllFilters = () => {
      searchInput.value = '';
      currentSearchQuery = '';
      selectedCategory = 'all';
      renderCategoryTabs();
      renderContent();
    };

    resetFilterBtn.addEventListener('click', resetAllFilters);
    emptyResetBtn.addEventListener('click', resetAllFilters);

    // Keyboard shortcuts (Cmd+K, /, Esc)
    document.addEventListener('keydown', (e) => {
      // Focus Search: Cmd+K or Ctrl+K or '/'
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      } else if (e.key === '/' && document.activeElement !== searchInput) {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }

      // Escape to clear search and blur
      if (e.key === 'Escape') {
        if (searchInput.value || currentSearchQuery) {
          searchInput.value = '';
          currentSearchQuery = '';
          renderContent();
        }
        searchInput.blur();
      }
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
