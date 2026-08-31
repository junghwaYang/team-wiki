(function () {
  'use strict';

  const DEPARTMENT_NAMES = {
    engineering: ['개발팀', '개발'],
    design: ['디자인팀', '디자인'],
    planning: ['기획팀', '기획'],
    operations: ['운영/CX팀', '운영', 'CX', '운영팀']
  };

  const triggerButton = document.getElementById('linkGenTriggerBtn');
  const modal = document.getElementById('linkGenModal');
  const closeButton = document.getElementById('linkGenCloseBtn');
  const uploadArea = document.getElementById('linkGenUploadArea');
  const fileInput = document.getElementById('linkGenFileInput');
  const fileStatus = document.getElementById('linkGenFileStatus');
  const results = document.getElementById('linkGenResults');
  const resultBody = document.getElementById('linkGenResultBody');
  let lastFocusedElement = null;

  if (!triggerButton || !modal || !closeButton || !uploadArea || !fileInput || !fileStatus || !results || !resultBody) {
    return;
  }

  function getDepartment(departmentName) {
    const normalizedName = String(departmentName || '').trim().toLocaleLowerCase('ko-KR');
    const code = Object.keys(DEPARTMENT_NAMES).find(departmentCode =>
      DEPARTMENT_NAMES[departmentCode].some(name => name.toLocaleLowerCase('ko-KR') === normalizedName)
    );

    return code ? { code, displayName: DEPARTMENT_NAMES[code][0] } : null;
  }

  function buildOnboardingUrl(departmentCode, name) {
    const url = new URL('onboarding.html', window.location.href);
    url.searchParams.set('dept', departmentCode);
    url.searchParams.set('name', name);
    return url.href;
  }

  function processRows(rawRows) {
    const rows = rawRows
      .map(row => [row[0], row[1], row[2]].map(value => String(value == null ? '' : value).trim()))
      .filter(row => row.some(Boolean));

    if (rows.length && !getDepartment(rows[0][1])) {
      rows.shift();
    }

    return rows.map(([name, departmentName]) => {
      const department = getDepartment(departmentName);
      return {
        name,
        originalDepartment: departmentName,
        department,
        link: department ? buildOnboardingUrl(department.code, name) : ''
      };
    });
  }

  function parseText(text) {
    return text
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .map(line => line.split(','));
  }

  function readFile(file, mode) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      if (mode === 'array') {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    });
  }

  function renderRows(rows) {
    resultBody.replaceChildren();

    rows.forEach(row => {
      const tableRow = document.createElement('tr');
      const nameCell = document.createElement('td');
      const departmentCell = document.createElement('td');
      const linkCell = document.createElement('td');
      const copyCell = document.createElement('td');

      nameCell.textContent = row.name;
      if (row.department) {
        departmentCell.textContent = row.department.displayName;
        linkCell.textContent = row.link;
        linkCell.className = 'link-gen-link-cell';

        const copyButton = document.createElement('button');
        copyButton.type = 'button';
        copyButton.className = 'link-gen-copy-btn';
        copyButton.textContent = '복사';
        copyButton.dataset.link = row.link;
        copyButton.setAttribute('aria-label', `${row.name}님의 온보딩 링크 복사`);
        copyCell.appendChild(copyButton);
      } else {
        departmentCell.textContent = `매칭 실패(${row.originalDepartment})`;
        departmentCell.className = 'link-gen-match-failed';
      }

      tableRow.append(nameCell, departmentCell, linkCell, copyCell);
      resultBody.appendChild(tableRow);
    });

    results.hidden = false;
    fileStatus.textContent = `${rows.length}명의 명단을 처리했습니다.`;
  }

  function openModal() {
    lastFocusedElement = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    closeButton.focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocusedElement) {
      lastFocusedElement.focus();
    }
  }

  async function handleFile(file) {
    const extension = file.name.split('.').pop().toLowerCase();
    let rawRows;

    if (extension === 'csv' || extension === 'txt') {
      rawRows = parseText(await readFile(file, 'text'));
    } else if (extension === 'xlsx' || extension === 'xls') {
      if (!window.XLSX) {
        throw new Error('Excel 파일 파서가 로드되지 않았습니다.');
      }
      const workbook = window.XLSX.read(await readFile(file, 'array'), { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      rawRows = window.XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
    } else {
      throw new Error('지원하지 않는 파일 형식입니다.');
    }

    renderRows(processRows(rawRows));
  }

  triggerButton.addEventListener('click', openModal);
  closeButton.addEventListener('click', closeModal);
  uploadArea.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      fileInput.click();
    }
  });
  modal.addEventListener('click', event => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener('keydown', event => {
    if (modal.hidden) return;
    if (event.key === 'Escape') {
      closeModal();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusableElements = Array.from(modal.querySelectorAll('button:not([disabled]), [tabindex="0"]'));
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  });
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;

    results.hidden = true;
    fileStatus.textContent = `${file.name} 파일을 처리하는 중입니다.`;
    try {
      await handleFile(file);
    } catch (error) {
      console.warn('Could not generate onboarding links:', error);
      fileStatus.textContent = error.message || '파일을 처리하지 못했습니다.';
    }
  });
  resultBody.addEventListener('click', async event => {
    const copyButton = event.target.closest('.link-gen-copy-btn');
    if (!copyButton) return;

    try {
      await navigator.clipboard.writeText(copyButton.dataset.link);
      copyButton.textContent = '복사됨';
      setTimeout(() => { copyButton.textContent = '복사'; }, 1200);
    } catch (error) {
      console.warn('Could not copy onboarding link:', error);
      alert('링크를 복사하지 못했습니다.');
    }
  });
})();
