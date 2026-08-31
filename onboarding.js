/**
 * Onboarding Checklist - Vanilla JavaScript Implementation
 * Data source: wiki-data.json
 * Icons: Lucide Icons
 */

(function () {
  'use strict';

  // Category Icon & Theme Mapping
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

  // Department Definitions (표시용 이름/아이콘만 관리 — 문서 노출 여부는 wiki-data.json의
  // item.onboardingDepartments 로 결정한다)
  const DEPARTMENTS = {
    engineering: { name: '개발팀', icon: 'code-2' },
    design: { name: '디자인팀', icon: 'palette' },
    planning: { name: '기획팀', icon: 'file-text' },
    operations: { name: '운영/CX팀', icon: 'headset' }
  };

  const STORAGE_KEY = 'team_wiki_onboarding_checks_v1';
  // ponytail: 로그인/서버가 없는 정적 사이트라 실제 접근 제어가 아닌 클라이언트 소프트 락.
  // 개발자도구로 우회 가능하지만, 정적 페이지 구조 안에서는 이 이상의 강제가 불가능하다.
  const DEPT_CLAIM_KEY = 'team_wiki_onboarding_dept_v1';

  // State
  let wikiData = null;
  let currentDept = 'engineering';
  let checkedItems = {}; // { [itemId]: boolean }

  // DOM Elements
  const deptDisplayName = document.getElementById('deptDisplayName');
  const progressCounter = document.getElementById('progressCounter');
  const progressBarFill = document.getElementById('progressBarFill');
  const progressMessage = document.getElementById('progressMessage');
  const resetProgressBtn = document.getElementById('resetProgressBtn');
  const checklistContainer = document.getElementById('checklistContainer');
  const backToWikiBtn = document.querySelector('.back-to-wiki-btn');

  // Load Saved Checks from LocalStorage
  function loadSavedChecks() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        checkedItems = JSON.parse(saved);
      } else {
        checkedItems = {};
      }
    } catch (e) {
      console.warn('Could not load onboarding progress from localStorage:', e);
      checkedItems = {};
    }
  }

  // Save Checks to LocalStorage
  function saveChecks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedItems));
    } catch (e) {
      console.warn('Could not save onboarding progress to localStorage:', e);
    }
  }

  // Refresh Lucide Icons
  function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  // Escape HTML helper
  function escapeHtml(string) {
    if (!string) return '';
    return String(string)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Parse Department from URL
  function getDeptFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const dept = params.get('dept');
    if (dept && DEPARTMENTS[dept]) {
      return dept;
    }
    return 'engineering';
  }

  // Update URL Query Parameter
  function updateDeptUrl(dept) {
    const url = new URL(window.location);
    url.searchParams.set('dept', dept);
    window.history.replaceState({}, '', url);
  }

  // Initialize
  async function init() {
    loadSavedChecks();
    currentDept = getDeptFromUrl();
    try {
      localStorage.setItem(DEPT_CLAIM_KEY, currentDept);
    } catch (e) {
      console.warn('Could not save onboarding department claim:', e);
    }

    try {
      const response = await fetch('./wiki-data.json', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      wikiData = await response.json();

      updateActiveTabUI();
      renderChecklist();
      setupEventListeners();
      refreshIcons();
    } catch (error) {
      console.error('Failed to load wiki-data.json for onboarding:', error);
      checklistContainer.innerHTML = `
        <div style="text-align: center; padding: 3rem; background: #ffffff; border-radius: var(--radius-lg); border: 1px solid var(--border-light);">
          <h3 style="color: #be123c; margin-bottom: 0.5rem;">데이터를 불러오지 못했습니다</h3>
          <p style="color: var(--text-muted);">wiki-data.json 파일이 없거나 형식이 올바르지 않습니다.</p>
        </div>
      `;
    }
  }

  // Update Department Name in Header
  function updateActiveTabUI() {
    const deptConfig = DEPARTMENTS[currentDept] || DEPARTMENTS.engineering;
    if (deptDisplayName) {
      deptDisplayName.textContent = deptConfig.name;
    }
  }

  // Get categories relevant to current department, with items filtered to
  // only those whose onboardingDepartments includes currentDept.
  function getDepartmentCategories() {
    if (!wikiData || !wikiData.categories) return [];

    return wikiData.categories
      .map(cat => ({
        ...cat,
        items: (cat.items || []).filter(item =>
          (item.onboardingDepartments || []).includes(currentDept)
        )
      }))
      .filter(cat => cat.items.length > 0);
  }

  // Render Checklist
  function renderChecklist() {
    const categories = getDepartmentCategories();

    if (categories.length === 0) {
      checklistContainer.innerHTML = `
        <div style="text-align: center; padding: 3rem; background: #ffffff; border-radius: var(--radius-lg); border: 1px solid var(--border-light);">
          <p style="color: var(--text-muted);">해당 부서에 매핑된 카테고리가 없습니다.</p>
        </div>
      `;
      updateProgress();
      return;
    }

    let html = '';

    categories.forEach((category, index) => {
      const theme = CATEGORY_THEMES[category.id] || { icon: 'folder' };
      const items = category.items || [];
      const totalItems = items.length;
      
      const completedCount = items.filter(item => checkedItems[item.id]).length;
      const isCategoryAllChecked = totalItems > 0 && completedCount === totalItems;

      // First category is open by default
      const isOpen = index === 0;

      html += `
        <article class="category-checklist-item ${isOpen ? 'open' : ''} ${isCategoryAllChecked ? 'all-completed' : ''}" id="cat-card-${escapeHtml(category.id)}" data-cat-id="${escapeHtml(category.id)}">
          <!-- Accordion Header -->
          <div class="category-row-header" role="button" aria-expanded="${isOpen ? 'true' : 'false'}" aria-controls="cat-body-${escapeHtml(category.id)}">
            <div class="category-header-left">
              <!-- Category Checkbox -->
              <label class="custom-checkbox-wrapper" title="카테고리 전체 완료/해제">
                <input 
                  type="checkbox" 
                  class="checkbox-input category-checkbox" 
                  data-cat-id="${escapeHtml(category.id)}" 
                  ${isCategoryAllChecked ? 'checked' : ''} 
                  aria-label="${escapeHtml(category.name)} 카테고리 전체 체크"
                >
              </label>

              <div class="category-title-info">
                <div class="category-friendly-message">
                  <span class="cat-name-tag">
                    <i data-lucide="${theme.icon}" style="width: 0.95rem; height: 0.95rem; vertical-align: -0.125rem; display: inline-block;"></i>
                    ${escapeHtml(category.name)}
                  </span>
                  <span>관련 문서는 여기서 확인하세요</span>
                </div>
                <span class="category-item-count-sub">
                  총 ${totalItems}개 문서 중 <strong class="cat-checked-count">${completedCount}</strong>개 확인 완료
                </span>
              </div>
            </div>

            <div class="category-header-right">
              <span class="category-completion-badge ${isCategoryAllChecked ? 'completed' : ''}">
                ${isCategoryAllChecked ? '✓ 완료됨' : `${completedCount}/${totalItems}`}
              </span>
              <i data-lucide="chevron-down" class="accordion-chevron"></i>
            </div>
          </div>

          <!-- Accordion Content (Sub-items) -->
          <div class="category-accordion-body" id="cat-body-${escapeHtml(category.id)}">
            <div class="item-checklist-list">
              ${items.map(item => {
                const isChecked = !!checkedItems[item.id];
                return `
                  <div class="sub-checklist-row ${isChecked ? 'item-completed' : ''}" data-item-id="${escapeHtml(item.id)}">
                    <label class="custom-checkbox-wrapper" title="확인 완료 체크">
                      <input 
                        type="checkbox" 
                        class="checkbox-input item-checkbox" 
                        data-cat-id="${escapeHtml(category.id)}" 
                        data-item-id="${escapeHtml(item.id)}" 
                        ${isChecked ? 'checked' : ''}
                        aria-label="${escapeHtml(item.title)} 확인 완료"
                      >
                    </label>

                    <div class="sub-item-content">
                      <div class="sub-item-top">
                        <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="sub-item-title-link" title="새 창에서 문서 열기">
                          <span class="sub-item-title">${escapeHtml(item.title)}</span>
                          <i data-lucide="external-link" class="link-icon"></i>
                        </a>
                      </div>
                      <p class="sub-item-desc">${escapeHtml(item.description)}</p>
                      <div class="sub-item-meta">
                        <span class="sub-item-contact">
                          <i data-lucide="user" style="width: 0.75rem; height: 0.75rem;"></i>
                          ${escapeHtml(item.contact)}
                        </span>
                        <time datetime="${escapeHtml(item.updatedAt)}">최종 업데이트: ${escapeHtml(item.updatedAt)}</time>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </article>
      `;
    });

    checklistContainer.innerHTML = html;
    updateProgress();
    refreshIcons();
  }

  // Whether every required item for the current department is checked
  function isOnboardingComplete() {
    const categories = getDepartmentCategories();
    if (categories.length === 0) return false;
    return categories.every(cat =>
      (cat.items || []).every(item => !!checkedItems[item.id])
    );
  }

  // Update Progress Bar and Stats
  function updateProgress() {
    const categories = getDepartmentCategories();
    let totalItems = 0;
    let completedItems = 0;

    categories.forEach(cat => {
      (cat.items || []).forEach(item => {
        totalItems++;
        if (checkedItems[item.id]) {
          completedItems++;
        }
      });
    });

    const percentage = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);

    if (progressCounter) {
      progressCounter.textContent = `${completedItems} / ${totalItems} 완료 (${percentage}%)`;
    }
    if (progressBarFill) {
      progressBarFill.style.width = `${percentage}%`;
    }

    if (progressMessage) {
      if (percentage === 100 && totalItems > 0) {
        progressMessage.innerHTML = `
          <i data-lucide="party-popper" style="width: 1.125rem; height: 1.125rem; color: #16a34a;"></i>
          <span style="color: #15803d; font-weight: 700;">축하합니다! 모든 필수 온보딩 문서를 확인하셨습니다. 환영합니다! 🎉</span>
        `;
      } else if (completedItems > 0) {
        progressMessage.innerHTML = `
          <i data-lucide="check-circle" style="width: 1rem; height: 1rem; color: var(--accent-primary);"></i>
          <span>잘 진행하고 계십니다! (${percentage}% 달성) 계속해서 다음 항목들을 확인해 보세요.</span>
        `;
      } else {
        progressMessage.innerHTML = `
          <i data-lucide="info" style="width: 1rem; height: 1rem;"></i>
          <span>각 카테고리를 클릭하여 세부 문서를 확인하고 체크해 보세요.</span>
        `;
      }
      refreshIcons();
    }
  }

  // Setup Event Listeners
  function setupEventListeners() {
    // 1. Accordion Header Click & Checkbox Handling
    checklistContainer.addEventListener('click', (e) => {
      // If clicked on category checkbox
      if (e.target.classList.contains('category-checkbox')) {
        const catId = e.target.dataset.catId;
        const isChecked = e.target.checked;
        const category = getDepartmentCategories().find(c => c.id === catId);

        if (category && category.items) {
          category.items.forEach(item => {
            checkedItems[item.id] = isChecked;
          });
          saveChecks();
          renderChecklist();
        }
        return;
      }

      // If clicked on individual item checkbox
      if (e.target.classList.contains('item-checkbox')) {
        const itemId = e.target.dataset.itemId;
        const catId = e.target.dataset.catId;
        const isChecked = e.target.checked;

        checkedItems[itemId] = isChecked;
        saveChecks();

        // Update item row UI
        const itemRow = e.target.closest('.sub-checklist-row');
        if (itemRow) {
          itemRow.classList.toggle('item-completed', isChecked);
        }

        // Update category state
        const category = getDepartmentCategories().find(c => c.id === catId);
        if (category && category.items) {
          const totalCatItems = category.items.length;
          const completedCatItems = category.items.filter(it => checkedItems[it.id]).length;
          const isCatCompleted = totalCatItems > 0 && completedCatItems === totalCatItems;

          const catCard = document.getElementById(`cat-card-${catId}`);
          if (catCard) {
            catCard.classList.toggle('all-completed', isCatCompleted);
            const catCheckbox = catCard.querySelector('.category-checkbox');
            if (catCheckbox) catCheckbox.checked = isCatCompleted;

            const badge = catCard.querySelector('.category-completion-badge');
            if (badge) {
              badge.classList.toggle('completed', isCatCompleted);
              badge.textContent = isCatCompleted ? '✓ 완료됨' : `${completedCatItems}/${totalCatItems}`;
            }

            const countSub = catCard.querySelector('.cat-checked-count');
            if (countSub) countSub.textContent = completedCatItems;
          }
        }

        updateProgress();
        return;
      }

      // Accordion Toggle (ignore clicks originating from the checkbox itself)
      if (e.target.closest('.custom-checkbox-wrapper')) return;
      const header = e.target.closest('.category-row-header');
      if (header) {
        const card = header.closest('.category-checklist-item');
        if (card) {
          const isOpen = card.classList.contains('open');
          card.classList.toggle('open', !isOpen);
          header.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
        }
      }
    });

    // 3. Reset Progress Button
    if (resetProgressBtn) {
      resetProgressBtn.addEventListener('click', () => {
        const deptConfig = DEPARTMENTS[currentDept] || DEPARTMENTS.engineering;
        if (!confirm(`[${deptConfig.name}] 온보딩 체크리스트 확인 상태를 초기화하시겠습니까?`)) {
          return;
        }

        const categories = getDepartmentCategories();
        categories.forEach(cat => {
          (cat.items || []).forEach(item => {
            delete checkedItems[item.id];
          });
        });

        saveChecks();
        renderChecklist();
      });
    }

    // 4. Block "메인 위키 홈으로" navigation until onboarding is complete
    if (backToWikiBtn) {
      backToWikiBtn.addEventListener('click', (e) => {
        if (!isOnboardingComplete()) {
          e.preventDefault();
          showBlockedNavModal();
        }
      });
    }
  }

  // Custom modal shown when navigating to the main wiki before onboarding is complete
  function showBlockedNavModal() {
    if (document.getElementById('onboardingBlockModal')) return;

    const overlay = document.createElement('div');
    overlay.className = 'onboarding-modal-overlay';
    overlay.id = 'onboardingBlockModal';
    overlay.innerHTML = `
      <div class="onboarding-modal-card" role="alertdialog" aria-modal="true" aria-labelledby="onboardingModalTitle">
        <div class="onboarding-modal-icon-wrap">
          <i data-lucide="lock"></i>
        </div>
        <h3 id="onboardingModalTitle" class="onboarding-modal-title">온보딩을 먼저 완료해주세요</h3>
        <p class="onboarding-modal-desc">체크리스트를 모두 확인해야 메인 위키로 이동할 수 있습니다.</p>
        <button type="button" class="onboarding-modal-confirm-btn">확인</button>
      </div>
    `;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    refreshIcons();

    function closeModal() {
      overlay.remove();
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeydown);
    }
    function onKeydown(e) {
      if (e.key === 'Escape') closeModal();
    }

    overlay.querySelector('.onboarding-modal-confirm-btn').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', onKeydown);
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
