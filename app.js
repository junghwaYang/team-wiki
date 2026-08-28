/**
 * Team Wiki - Vanilla JavaScript Implementation
 * Data source: wiki-data.json
 * Icons: Lucide Icons
 */

(function () {
  'use strict';

  // Category Icon (Lucide) & Theme Mapping
  const CATEGORY_THEMES = {
    planning: {
      icon: 'file-text',
      colorVar: 'cat-planning'
    },
    design: {
      icon: 'palette',
      colorVar: 'cat-design'
    },
    engineering: {
      icon: 'code-2',
      colorVar: 'cat-engineering'
    },
    people: {
      icon: 'users',
      colorVar: 'cat-people'
    },
    'expense-purchase': {
      icon: 'credit-card',
      colorVar: 'cat-expense'
    },
    'project-collaboration': {
      icon: 'folder-kanban',
      colorVar: 'cat-project'
    },
    'brand-assets': {
      icon: 'sparkles',
      colorVar: 'cat-brand'
    },
    'customer-operations': {
      icon: 'headset',
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
  const sidebarNav = document.getElementById('sidebarNav');
  const totalCategoryCount = document.getElementById('totalCategoryCount');
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

  // Refresh Lucide Icons
  function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  // Initialize
  async function init() {
    try {
      const response = await fetch('./wiki-data.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      wikiData = await response.json();
      renderNoticeAndMeta();
      renderSidebarNav();
      renderContent();
      setupEventListeners();
      refreshIcons();
    } catch (error) {
      console.error('Failed to load wiki-data.json:', error);
      noticeText.textContent = '위키 데이터를 불러오는데 실패했습니다. 페이지를 새로고침하거나 관리자에게 문의하세요.';
      wikiSection.innerHTML = `
        <div class="empty-state" style="display: block;">
          <h3 class="empty-title">데이터를 불러올 수 없습니다</h3>
          <p class="empty-desc">wiki-data.json 파일을 찾을 수 없거나 파일 형식이 잘못되었습니다.</p>
        </div>
      `;
      refreshIcons();
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

  // Render Sidebar Navigation
  function renderSidebarNav() {
    if (!wikiData || !wikiData.categories) return;

    const totalCategories = wikiData.categories.length;
    const totalCount = wikiData.categories.reduce((acc, cat) => acc + (cat.items ? cat.items.length : 0), 0);

    if (totalCategoryCount) {
      totalCategoryCount.textContent = `${totalCategories}개`;
    }

    let html = `
      <button type="button" class="sidebar-nav-item ${selectedCategory === 'all' ? 'active' : ''}" data-category="all" aria-current="${selectedCategory === 'all' ? 'page' : 'false'}">
        <span class="nav-label">
          <i data-lucide="layers" class="nav-icon"></i>
          <span>전체 보기</span>
        </span>
        <span class="nav-count">${totalCount}</span>
      </button>
    `;

    wikiData.categories.forEach(category => {
      const theme = CATEGORY_THEMES[category.id] || { icon: 'folder' };
      const count = category.items ? category.items.length : 0;
      const isActive = selectedCategory === category.id;

      html += `
        <button type="button" class="sidebar-nav-item ${isActive ? 'active' : ''}" data-category="${escapeHtml(category.id)}" aria-current="${isActive ? 'page' : 'false'}">
          <span class="nav-label">
            <i data-lucide="${theme.icon}" class="nav-icon"></i>
            <span>${escapeHtml(category.name)}</span>
          </span>
          <span class="nav-count">${count}</span>
        </button>
      `;
    });

    sidebarNav.innerHTML = html;
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
          if (categoryNameMatches) return true;

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
      refreshIcons();
      return;
    }

    emptyState.hidden = true;

    // Render Categories & Cards Grid
    let html = '';
    categories.forEach(category => {
      const theme = CATEGORY_THEMES[category.id] || { icon: 'folder' };

      html += `
        <article class="wiki-category-group" id="cat-${escapeHtml(category.id)}">
          <header class="category-header">
            <div class="category-header-title">
              <span class="category-icon-wrapper">
                <i data-lucide="${theme.icon}" class="category-icon"></i>
              </span>
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
                      <i data-lucide="arrow-up-right"></i>
                    </span>
                  </div>
                  <p class="card-description">${highlightText(item.description, query)}</p>
                </div>

                <div class="card-meta">
                  <span class="contact-pill">
                    <i data-lucide="user" class="meta-icon"></i>
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
    refreshIcons();
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

    // Sidebar Navigation click handler
    sidebarNav.addEventListener('click', (e) => {
      const btn = e.target.closest('.sidebar-nav-item');
      if (!btn) return;

      const cat = btn.dataset.category;
      if (selectedCategory === cat) return;

      selectedCategory = cat;

      // Update active state in sidebar
      sidebarNav.querySelectorAll('.sidebar-nav-item').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-current', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-current', 'page');

      renderContent();

      // In mobile view, scroll to main content smoothly
      if (window.innerWidth <= 960) {
        document.querySelector('.main-content').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    // Reset filters
    const resetAllFilters = () => {
      searchInput.value = '';
      currentSearchQuery = '';
      selectedCategory = 'all';
      renderSidebarNav();
      renderContent();
      refreshIcons();
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
