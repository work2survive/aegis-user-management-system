/**
 * ============================================================================
 * AEGIS IDENTITY — USER & HIERARCHY MANAGEMENT SYSTEM (CZ / SK)
 * ============================================================================
 * 
 * Architecture & Specification Overview:
 * --------------------------------------
 * This application is a fully client-side User & Role Management simulator
 * tailored for educational, institutional, and enterprise hierarchical structures
 * across the Czech Republic and Slovak Republic.
 * 
 * Supported Regulatory & Behavioral Rules:
 * - RULE 0.0: Mandatory Unified Phone Numbers (+420 / +421 area code normalization)
 * - RULE 1.0 - 1.1: Group Management (Create, Name, Rename, Edit, Delete, Disable)
 * - RULE 2.0 - 2.1: User Management with Scope Enforcement (Country/Region/Org/SubOrg)
 * - RULE 3.1: Multi-User Bulk Operations (Status, Group, Org reassignments)
 * - RULE 3.2: CSV & XLS Roster Ingestion with strict client-side row validation
 * - RULE 4.0 - 4.2: Hierarchical Entity Operations (Regions, Orgs, Sub-Orgs)
 * - RULE 5.0: Group-level Geographic & Institutional Purview Constraints
 * - RULE 6.0 - 6.7: Privacy Shields & Credential Lifecycle (Entropy meter, OTP recovery)
 * - RULE 7.0 - 8.0: RCS Business Messaging Matrix (10 distinct categories with >=1 rule)
 * - DUPLICATE PRIVILEGE CHECK: Prevents identical permission sets between distinct groups
 * - AUTO-NAMING ENGINE: Computes human-readable titles & military-grade codenames
 * - FLOATING TEST SIMULATOR: Draggable, minimizable persona switcher with God Mode (👁️⃤)
 * 
 * @author Aegis Identity Architecture Team
 * @license MIT
 * ============================================================================
 */

(function () {
  'use strict';

  // =========================================================================
  // SECTION 1: SYSTEM STATE & DATABASE CACHING
  // =========================================================================

  /**
   * Primary persistent database container.
   * State is seeded from `data.js` (window.DB_INITIAL) on cold boot and
   * synchronized with localStorage to retain testing mutations across reloads.
   */
  const DB = {
    /** @type {Array<Object>} 16 Czech and Slovak territorial administrative regions */
    regions: JSON.parse(localStorage.getItem('aegis_regions')) || (window.DB_INITIAL ? window.DB_INITIAL.regions : []),

    /** @type {Array<Object>} 15 Universities, High Schools & Regional Educational Authorities */
    organizations: JSON.parse(localStorage.getItem('aegis_orgs')) || (window.DB_INITIAL ? window.DB_INITIAL.organizations : []),

    /** @type {Array<Object>} 22 Faculties, Academic Departments & Specialized Units */
    subOrganizations: JSON.parse(localStorage.getItem('aegis_sub_orgs')) || (window.DB_INITIAL ? window.DB_INITIAL.subOrganizations : []),

    /** @type {Array<Object>} 10 Standardized RCS Rich Communication Suite Categories */
    rcsMessageTypes: window.DB_INITIAL ? window.DB_INITIAL.rcsMessageTypes : [],

    /** @type {Array<Object>} 20 Role groups with varying privileges and scope limits */
    groups: JSON.parse(localStorage.getItem('aegis_groups')) || (window.DB_INITIAL ? window.DB_INITIAL.groups : []),

    /** @type {Array<Object>} 300 Slovak & Czech users with unified phone numbers */
    users: JSON.parse(localStorage.getItem('aegis_users')) || (window.DB_INITIAL ? window.DB_INITIAL.users : []),

    /** @type {Array<Object>} Historical log of simulated outbound RCS broadcasts */
    rcsLogs: JSON.parse(localStorage.getItem('aegis_rcs_logs')) || [
      {
        id: 'rcs-log-01',
        timestamp: '2026-11-06T08:15:00Z',
        senderGroupId: 'grp-super-admin',
        typeId: 'rcs-sys-notice',
        title: 'Systémová údržba identitného portálu',
        recipientGroupIds: ['grp-school-principals', 'grp-teachers-senior'],
        status: 'Delivered'
      }
    ],

    /** @type {Array<Object>} Append-only security audit trail of privileged operations */
    auditLogs: JSON.parse(localStorage.getItem('aegis_audit_logs')) || [
      {
        timestamp: new Date().toISOString(),
        actor: 'Jan Novák (Super Admin)',
        action: 'System Boot',
        entity: 'Database 300 Users Loaded',
        status: 'Success'
      }
    ]
  };

  /**
   * Active simulated persona session.
   * Defaults to the root Super Administrator (Jan Novák / NEXUS-OMNI).
   * Can be hot-swapped dynamically via the testing panel or switcher modal.
   * @type {Object}
   */
  let currentUser = DB.users.find(u => u.groupId === 'grp-super-admin') || DB.users[0];

  /** @type {string} Current visible tab identifier */
  let activeTab = 'tab-users';

  /** @type {{page: number, pageSize: number}} User pagination state */
  let userPagination = { page: 1, pageSize: 15 };

  /** @type {Set<string>} Set of user IDs selected for batch operations */
  let selectedUserIds = new Set();

  /**
   * Filtering constraints applied to the Users management view.
   * Scoped dynamically against the logged-in user's authorized territory.
   */
  let userFilterState = {
    search: '',
    country: 'ALL',
    regionId: 'ALL',
    orgId: 'ALL',
    subOrgId: 'ALL',
    groupId: 'ALL',
    status: 'ALL'
  };

  /** Filtering constraints applied to the Groups grid view */
  let groupFilterState = {
    search: '',
    category: 'ALL'
  };

  /** Temporary memory holding parsed CSV/XLS records awaiting user confirmation */
  let stagedImportUsers = [];

  /**
   * Flushes current in-memory collections into localStorage for persistence.
   */
  function saveDB() {
    try {
      localStorage.setItem('aegis_users', JSON.stringify(DB.users));
      localStorage.setItem('aegis_groups', JSON.stringify(DB.groups));
      localStorage.setItem('aegis_orgs', JSON.stringify(DB.organizations));
      localStorage.setItem('aegis_sub_orgs', JSON.stringify(DB.subOrganizations));
      localStorage.setItem('aegis_regions', JSON.stringify(DB.regions));
      localStorage.setItem('aegis_rcs_logs', JSON.stringify(DB.rcsLogs));
      localStorage.setItem('aegis_audit_logs', JSON.stringify(DB.auditLogs));
    } catch (e) {
      console.warn('Storage quota exceeded or storage disabled:', e);
    }
  }

  /**
   * Records a timestamped audit trail record of privileged user actions.
   * @param {string} action - Brief identifier of operation (e.g., 'User Creation')
   * @param {string} entity - Resource acted upon (e.g., 'Jan Novák')
   * @param {string} status - Outcome ('Success' | 'Denied' | 'Warning')
   */
  function addAuditLog(action, entity, status = 'Success') {
    const entry = {
      timestamp: new Date().toISOString(),
      actor: `${currentUser.name} (${getCurrentGroup().codeName})`,
      action,
      entity,
      status
    };
    DB.auditLogs.unshift(entry);
    if (DB.auditLogs.length > 100) DB.auditLogs.pop(); // Keep rolling window of 100 entries
    renderAuditLogs();
  }

  // =========================================================================
  // SECTION 2: ACCESS CONTROL & SCOPE RESTRICTION LOGIC
  // =========================================================================

  /**
   * Retrieves the group definition associated with the active simulated persona.
   * @returns {Object} Group entity
   */
  function getCurrentGroup() {
    return DB.groups.find(g => g.id === currentUser.groupId) || DB.groups[0];
  }

  /**
   * Evaluates whether the currently active user possesses a given capability flag.
   * Iterates through all categorized privilege arrays inside the active group.
   * 
   * @param {string} privilegeKey - e.g. 'create_user', 'view_others_personal', etc.
   * @returns {boolean} True if granted, false otherwise.
   */
  function hasPrivilege(privilegeKey) {
    const group = getCurrentGroup();
    if (!group || !group.privileges) return false;

    // Scan across all privilege buckets (user_mgmt, group_mgmt, personal_info, hierarchy_mgmt)
    for (const cat in group.privileges) {
      const val = group.privileges[cat];
      if (Array.isArray(val) && val.includes(privilegeKey)) return true;
    }
    return false;
  }

  /**
   * Enforces Scope Restrictions (Rule 5).
   * Verifies if a resource in a target country, region, organization, or sub-organization
   * falls within the purview of the current user's group permissions.
   * 
   * @param {string} itemCountry - 'CZ' | 'SK'
   * @param {string} itemRegionId - e.g. 'reg-cz-prg'
   * @param {string} itemOrgId - e.g. 'org-cuni'
   * @param {string} itemSubOrgId - e.g. 'sub-cuni-mff'
   * @returns {boolean} True if within authorized scope, false if access denied.
   */
  function canManageScope(itemCountry, itemRegionId, itemOrgId, itemSubOrgId) {
    const group = getCurrentGroup();
    if (!group || !group.scope) return true;
    const scope = group.scope;

    // Check national boundary
    if (scope.country && scope.country !== 'ALL' && itemCountry && itemCountry !== scope.country) {
      return false;
    }
    // Check regional boundary
    if (scope.regionId && scope.regionId !== 'ALL' && itemRegionId && itemRegionId !== scope.regionId) {
      return false;
    }
    // Check organizational boundary
    if (scope.orgId && scope.orgId !== 'ALL' && itemOrgId && itemOrgId !== scope.orgId) {
      return false;
    }
    // Check sub-organizational boundary
    if (scope.subOrgId && scope.subOrgId !== 'ALL' && itemSubOrgId && itemSubOrgId !== scope.subOrgId) {
      return false;
    }
    return true;
  }

  // =========================================================================
  // SECTION 3: MANDATORY UNIFIED PHONE FORMAT ENGINE
  // =========================================================================

  /**
   * Normalizes raw user input into unified Czech (+420) or Slovak (+421) phone format.
   * Enforces 3-3-3 chunking: `+420 XXX XXX XXX` or `+421 XXX XXX XXX`.
   * 
   * @param {string} val - Raw input string
   * @returns {string} Clean standardized phone string
   */
  function formatPhoneNumber(val) {
    if (!val) return '';
    // Strip everything except digits and plus sign
    let clean = val.replace(/[^\d+]/g, '');
    if (!clean.startsWith('+')) {
      if (clean.startsWith('420') || clean.startsWith('421')) {
        clean = '+' + clean;
      } else if (clean.startsWith('0')) {
        // Assume Slovak mobile prefix 09XX -> +421 9XX
        clean = '+421' + clean.substring(1);
      } else {
        // Fallback default to Czech
        clean = '+420' + clean;
      }
    }

    const countryCode = clean.substring(0, 4); // +420 or +421
    const rest = clean.substring(4).replace(/\D/g, '');

    const p1 = rest.substring(0, 3);
    const p2 = rest.substring(3, 6);
    const p3 = rest.substring(6, 9);

    let formatted = countryCode;
    if (p1) formatted += ' ' + p1;
    if (p2) formatted += ' ' + p2;
    if (p3) formatted += ' ' + p3;
    return formatted;
  }

  /**
   * Strictly validates that a phone number satisfies the mandatory unified specification.
   * @param {string} val - Phone string to test
   * @returns {boolean} True if formatted exactly as `+(420|421) ddd ddd ddd`
   */
  function validatePhoneNumber(val) {
    if (!val) return false;
    const clean = val.trim();
    const re = /^\+(420|421)\s\d{3}\s\d{3}\s\d{3}$/;
    return re.test(clean);
  }

  /**
   * Privacy Protection Masking (Rule 6.0).
   * Masks sensitive attributes (e.g. personal phone number, national ID, address)
   * unless the active session has `view_others_personal` privilege.
   * 
   * @param {string} val - Unmasked sensitive value
   * @returns {string} Unmasked value or `••••••••••••• [Restricted]`
   */
  function maskSensitive(val) {
    if (!val) return '—';
    if (hasPrivilege('view_others_personal')) return val;
    return '••••••••••••• [Restricted]';
  }

  // =========================================================================
  // SECTION 4: SMART AUTO-NAMING & DUPLICATE PRIVILEGE CHECKS
  // =========================================================================

  /**
   * Generates a deterministic JSON hash signature of a group's privilege settings.
   * Used to detect exact duplicates across different groups.
   * 
   * @param {Object} privileges - Group privileges configuration
   * @returns {string} Canonical JSON representation
   */
  function computePrivilegeHash(privileges) {
    const canonical = {
      group: [...(privileges.group_mgmt || [])].sort(),
      user: [...(privileges.user_mgmt || [])].sort(),
      personal: [...(privileges.personal_info || [])].sort(),
      hierarchy: [...(privileges.hierarchy_mgmt || [])].sort(),
      rcsTriggerAllowed: Boolean(privileges.rcs_trigger?.allowed),
      rcsTriggerAll: Boolean(privileges.rcs_trigger?.allow_all),
      rcsTriggerTypes: [...(privileges.rcs_trigger?.types || [])].sort(),
      rcsReceiveAllowed: Boolean(privileges.rcs_receive?.allowed),
      rcsReceiveAll: Boolean(privileges.rcs_receive?.allow_all),
      rcsReceiveTypes: [...(privileges.rcs_receive?.types || [])].sort()
    };
    return JSON.stringify(canonical);
  }

  /**
   * Verifies if any existing group possesses the identical privilege signature.
   * Prevents creating or saving redundant duplicate groups.
   * 
   * @param {Object} privileges - New/edited privileges
   * @param {string|null} excludeGroupId - Group ID being edited (to skip self-comparison)
   * @returns {Object|null} Matching duplicate group, or null if unique.
   */
  function checkDuplicatePrivileges(privileges, excludeGroupId = null) {
    const targetHash = computePrivilegeHash(privileges);
    for (const grp of DB.groups) {
      if (excludeGroupId && grp.id === excludeGroupId) continue;
      const grpHash = computePrivilegeHash(grp.privileges);
      if (targetHash === grpHash) {
        return grp;
      }
    }
    return null;
  }

  /**
   * Generates a context-aware group name and operational codename
   * derived from the specific combination of privileges and scope selected.
   * 
   * @param {Object} privileges - Granted privilege arrays
   * @param {Object} scope - Selected scope restrictions
   * @returns {{name: string, codename: string}} Generated suggestions
   */
  function generateSmartGroupName(privileges, scope) {
    const parts = [];
    const codenameParts = [];

    // Geographical prefix
    let scopePrefix = '';
    if (scope.country === 'CZ') { scopePrefix = 'Czech'; codenameParts.push('CZ'); }
    else if (scope.country === 'SK') { scopePrefix = 'Slovak'; codenameParts.push('SK'); }

    const uMgmt = privileges.user_mgmt || [];
    const gMgmt = privileges.group_mgmt || [];
    const hMgmt = privileges.hierarchy_mgmt || [];
    const rcsTrig = privileges.rcs_trigger?.allowed;

    if (gMgmt.includes('create_group') && uMgmt.includes('create_user') && hMgmt.includes('manage_organizations')) {
      parts.push(scopePrefix ? `${scopePrefix} Chief Administrator` : 'Executive Super Administrator');
      codenameParts.push('NEXUS-OMNI');
    } else if (uMgmt.includes('create_user') && uMgmt.includes('bulk_edit_users')) {
      parts.push(scopePrefix ? `${scopePrefix} Identity Officer` : 'Registrar & User Operations');
      codenameParts.push('ID-REGISTRAR');
    } else if (rcsTrig && privileges.rcs_trigger?.types?.includes('rcs-emergency')) {
      parts.push(scopePrefix ? `${scopePrefix} Campus Security Dispatcher` : 'Emergency Alert Coordinator');
      codenameParts.push('VANGUARD-ALERT');
    } else if (uMgmt.includes('edit_user')) {
      parts.push(scopePrefix ? `${scopePrefix} Academic Supervisor` : 'Faculty Department Lead');
      codenameParts.push('FACULTY-LEAD');
    } else {
      parts.push(scopePrefix ? `${scopePrefix} Standard Member` : 'Authenticated Member');
      codenameParts.push('STANDARD-OPERATOR');
    }

    const randomSuffix = Math.floor(100 + Math.random() * 900);
    return {
      name: parts.join(' - ') + ` [Level ${Math.floor(Math.random() * 3) + 1}]`,
      codename: `${codenameParts.join('-')}-${randomSuffix}`
    };
  }

  // =========================================================================
  // SECTION 5: TOAST FEEDBACK NOTIFICATIONS
  // =========================================================================

  /**
   * Displays an animated toast alert at the bottom-left corner.
   * @param {string} message - User-facing text
   * @param {'info'|'success'|'warning'|'danger'} type - Styling token
   */
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'warning') icon = '⚠️';
    if (type === 'danger') icon = '❌';

    toast.innerHTML = `
      <span style="font-size: 1.1rem;">${icon}</span>
      <div style="flex: 1; font-weight: 500;">${message}</div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // =========================================================================
  // SECTION 6: UI RENDERING (HEADER & STATUS BANNER)
  // =========================================================================

  /**
   * Renders the top application header with active persona metrics:
   * Avatar, Name, Group badge, Geographic/Organizational breadcrumbs, and Scope Banner.
   */
  function renderHeader() {
    const group = getCurrentGroup();
    const user = currentUser;

    const initials = (user.firstName?.[0] || 'U') + (user.lastName?.[0] || 'N');
    const headerAvatar = document.getElementById('headerAvatar');
    if (headerAvatar) {
      headerAvatar.firstChild.nodeValue = initials;
    }

    const headerUserName = document.getElementById('headerUserName');
    if (headerUserName) headerUserName.textContent = user.name;

    const headerGroupBadge = document.getElementById('headerGroupBadge');
    if (headerGroupBadge) {
      headerGroupBadge.textContent = group.codeName || group.name;
      headerGroupBadge.title = group.name;
    }

    // Institutional hierarchy breadcrumbs
    const flag = user.country === 'CZ' ? '🇨🇿 CZ' : (user.country === 'SK' ? '🇸🇰 SK' : '🌐 Global');
    const reg = DB.regions.find(r => r.id === user.regionId)?.name || 'Region';
    const org = DB.organizations.find(o => o.id === user.orgId)?.name || 'Organization';
    const sub = DB.subOrganizations.find(s => s.id === user.subOrgId)?.name || 'Sub-org';

    const headerCountryFlag = document.getElementById('headerCountryFlag');
    if (headerCountryFlag) headerCountryFlag.textContent = flag;
    const headerRegionName = document.getElementById('headerRegionName');
    if (headerRegionName) headerRegionName.textContent = reg;
    const headerOrgName = document.getElementById('headerOrgName');
    if (headerOrgName) headerOrgName.textContent = org;
    const headerSubOrgName = document.getElementById('headerSubOrgName');
    if (headerSubOrgName) headerSubOrgName.textContent = sub;

    // Scope Restriction Status Banner
    const scopeBanner = document.getElementById('scopeBanner');
    const scopeText = document.getElementById('scopeBannerText');
    if (scopeBanner && scopeText) {
      const scope = group.scope;
      if (!scope || (scope.country === 'ALL' && scope.regionId === 'ALL' && scope.orgId === 'ALL' && scope.subOrgId === 'ALL')) {
        scopeBanner.classList.remove('restricted');
        scopeText.innerHTML = `Active Scope: <strong>Global (Unrestricted)</strong> — Full administrative purview across Czech &amp; Slovak regions.`;
      } else {
        scopeBanner.classList.add('restricted');
        const scopeParts = [];
        if (scope.country !== 'ALL') scopeParts.push(`Country: ${scope.country}`);
        if (scope.regionId !== 'ALL') {
          const rName = DB.regions.find(r => r.id === scope.regionId)?.name || scope.regionId;
          scopeParts.push(`Region: ${rName}`);
        }
        if (scope.orgId !== 'ALL') {
          const oName = DB.organizations.find(o => o.id === scope.orgId)?.name || scope.orgId;
          scopeParts.push(`Org: ${oName}`);
        }
        if (scope.subOrgId !== 'ALL') {
          const sName = DB.subOrganizations.find(s => s.id === scope.subOrgId)?.name || scope.subOrgId;
          scopeParts.push(`Sub-org: ${sName}`);
        }
        scopeText.innerHTML = `⚠️ Restricted Purview Active: <strong>${scopeParts.join(' &gt; ')}</strong> — Non-matching users and groups are hidden or read-only.`;
      }
    }

    renderTestingPanel();
  }

  // =========================================================================
  // SECTION 7: USERS MANAGEMENT VIEW & PAGINATION
  // =========================================================================

  /**
   * Filters the master 300-user database against:
   * 1. Active persona's territorial scope restrictions (Rule 2).
   * 2. Search query (name, email, mandatory phone, username).
   * 3. Facet dropdown filters (Country, Region, Organization, Sub-org, Group, Status).
   * 
   * @returns {Array<Object>} Filtered user array
   */
  function getFilteredUsers() {
    return DB.users.filter(user => {
      // Security Scope Boundary Check
      if (!canManageScope(user.country, user.regionId, user.orgId, user.subOrgId)) {
        return false;
      }

      // UI Facet filters
      if (userFilterState.country !== 'ALL' && user.country !== userFilterState.country) return false;
      if (userFilterState.regionId !== 'ALL' && user.regionId !== userFilterState.regionId) return false;
      if (userFilterState.orgId !== 'ALL' && user.orgId !== userFilterState.orgId) return false;
      if (userFilterState.subOrgId !== 'ALL' && user.subOrgId !== userFilterState.subOrgId) return false;
      if (userFilterState.groupId !== 'ALL' && user.groupId !== userFilterState.groupId) return false;
      if (userFilterState.status !== 'ALL' && user.status !== userFilterState.status) return false;

      // Text search matching
      if (userFilterState.search) {
        const q = userFilterState.search.toLowerCase();
        const matchesName = user.name.toLowerCase().includes(q);
        const matchesEmail = user.email.toLowerCase().includes(q);
        const matchesPhone = user.phone.includes(q);
        const matchesUsername = user.username.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesPhone && !matchesUsername) return false;
      }

      return true;
    });
  }

  /**
   * Renders the user data table, action buttons, privacy masks, and pagination.
   */
  function renderUsersTable() {
    const tableBody = document.getElementById('usersTableBody');
    if (!tableBody) return;

    const filtered = getFilteredUsers();
    const total = filtered.length;

    // Badges & Counters
    const tabBadge = document.getElementById('tabBadgeUsers');
    if (tabBadge) tabBadge.textContent = total;
    const metricCount = document.getElementById('metricUserCount');
    if (metricCount) metricCount.textContent = total;

    // Pagination calculations
    const page = userPagination.page;
    const pageSize = userPagination.pageSize;
    const totalPages = Math.ceil(total / pageSize) || 1;
    if (userPagination.page > totalPages) userPagination.page = totalPages;

    const startIdx = (userPagination.page - 1) * pageSize;
    const pageUsers = filtered.slice(startIdx, startIdx + pageSize);

    // Summary Text
    const summary = document.getElementById('usersPaginationSummary');
    if (summary) {
      const endIdx = Math.min(startIdx + pageSize, total);
      summary.textContent = total > 0 ? `Showing ${startIdx + 1}–${endIdx} of ${total} users` : 'No users match criteria';
    }

    if (pageUsers.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 3rem; color: var(--text-muted);">
            <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🔍</div>
            <div style="font-weight: 600;">No matching users found</div>
            <div style="font-size: 0.8rem;">Try clearing your search query or broadening the filter options.</div>
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = pageUsers.map(user => {
      const isSelected = selectedUserIds.has(user.id);
      const group = DB.groups.find(g => g.id === user.groupId) || { name: 'Unknown', codeName: 'N/A' };
      const org = DB.organizations.find(o => o.id === user.orgId)?.name || '—';
      const sub = DB.subOrganizations.find(s => s.id === user.subOrgId)?.name || '—';
      const reg = DB.regions.find(r => r.id === user.regionId)?.name || '—';

      const flag = user.country === 'CZ' ? '🇨🇿' : '🇸🇰';
      const isSelf = user.id === currentUser.id;

      // Granular permissions gating
      const canEdit = isSelf ? hasPrivilege('edit_own_personal') : hasPrivilege('edit_user');
      const canDelete = hasPrivilege('delete_user') && !isSelf;
      const canDisable = hasPrivilege('disable_user') && !isSelf;
      const canChangePwd = hasPrivilege('change_password');

      // Privacy mask on phone
      const maskedPhone = maskSensitive(user.phone);

      return `
        <tr class="${isSelected ? 'selected' : ''}" data-id="${user.id}">
          <td>
            <input type="checkbox" class="custom-checkbox user-row-check" data-id="${user.id}" ${isSelected ? 'checked' : ''} ${!hasPrivilege('bulk_edit_users') ? 'disabled' : ''}>
          </td>
          <td>
            <div class="cell-user-info">
              <div class="user-avatar-sm">${user.firstName[0]}${user.lastName[0]}</div>
              <div class="user-names-col">
                <span class="user-primary-name">${user.name}</span>
                <span class="user-secondary-email">${user.email}</span>
              </div>
            </div>
          </td>
          <td>
            <span class="phone-formatted">${maskedPhone}</span>
          </td>
          <td>
            <span class="badge badge-primary" title="${group.name}">${group.codeName}</span>
          </td>
          <td>
            <div style="display: flex; flex-direction: column;">
              <span style="font-weight: 500;">${org}</span>
              <span style="font-size: 0.725rem; color: var(--text-muted);">${sub}</span>
            </div>
          </td>
          <td>
            <span title="${reg}">${flag} ${reg.replace(' kraj', '')}</span>
          </td>
          <td>
            <span class="status-dot ${user.status}"></span>
            <span style="text-transform: capitalize; font-size: 0.8rem;">${user.status}</span>
          </td>
          <td style="text-align: right; white-space: nowrap;">
            <div style="display: inline-flex; gap: 0.35rem;">
              <button class="btn btn-outline btn-sm btn-icon-only btn-action-edit" data-id="${user.id}" title="${canEdit ? 'Edit User Details' : 'View User Details'}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </button>
              <button class="btn btn-outline btn-sm btn-icon-only btn-action-pwd" data-id="${user.id}" title="Manage Password (6.5 / 6.6 / 6.7)" ${!canChangePwd ? 'disabled' : ''}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </button>
              <button class="btn btn-outline btn-sm btn-icon-only btn-action-status" data-id="${user.id}" title="${user.status === 'active' ? 'Disable User' : 'Enable User'}" ${!canDisable ? 'disabled' : ''}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
              </button>
              <button class="btn btn-outline btn-sm btn-icon-only btn-action-delete" data-id="${user.id}" title="Delete User" ${!canDelete ? 'disabled' : ''} style="color: var(--danger);">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    renderPaginationControls(totalPages);
    renderBulkActionBar();
  }

  /**
   * Renders numeric pagination buttons with sliding window.
   * @param {number} totalPages - Total calculated page count
   */
  function renderPaginationControls(totalPages) {
    const container = document.getElementById('usersPaginationControls');
    if (!container) return;

    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    const cur = userPagination.page;
    let html = `
      <button class="page-btn" id="btnPagePrev" ${cur === 1 ? 'disabled' : ''}>&lt;</button>
    `;

    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || (p >= cur - 2 && p <= cur + 2)) {
        html += `<button class="page-btn ${p === cur ? 'active' : ''}" data-page="${p}">${p}</button>`;
      } else if (p === cur - 3 || p === cur + 3) {
        html += `<span style="padding: 0 4px; color: var(--text-muted);">…</span>`;
      }
    }

    html += `
      <button class="page-btn" id="btnPageNext" ${cur === totalPages ? 'disabled' : ''}>&gt;</button>
    `;
    container.innerHTML = html;
  }

  /**
   * Toggles the visibility of the bulk selection action bar based on selected users count.
   */
  function renderBulkActionBar() {
    const bar = document.getElementById('bulkActionBar');
    const label = document.getElementById('bulkSelectedCount');
    if (!bar || !label) return;

    const count = selectedUserIds.size;
    if (count > 0 && hasPrivilege('bulk_edit_users')) {
      bar.classList.add('visible');
      label.textContent = `${count} user${count > 1 ? 's' : ''} selected`;
    } else {
      bar.classList.remove('visible');
    }
  }

  // =========================================================================
  // SECTION 8: GROUPS & PRIVILEGES VIEW
  // =========================================================================

  /**
   * Filters the group catalog respecting category filters and active user scope.
   * @returns {Array<Object>} Filtered group array
   */
  function getFilteredGroups() {
    return DB.groups.filter(grp => {
      // Scope boundary check against current user's purview
      if (currentUser.groupId !== 'grp-super-admin') {
        const myScope = getCurrentGroup().scope;
        if (myScope && myScope.country !== 'ALL' && grp.scope && grp.scope.country !== 'ALL' && grp.scope.country !== myScope.country) {
          return false;
        }
      }

      if (groupFilterState.category !== 'ALL' && grp.category !== groupFilterState.category) return false;
      if (groupFilterState.search) {
        const q = groupFilterState.search.toLowerCase();
        const m1 = grp.name.toLowerCase().includes(q);
        const m2 = grp.codeName.toLowerCase().includes(q);
        const m3 = grp.description?.toLowerCase().includes(q);
        if (!m1 && !m2 && !m3) return false;
      }
      return true;
    });
  }

  /**
   * Renders the cards grid for the 20 Groups with privileges breakdown and scope tags.
   */
  function renderGroupsGrid() {
    const container = document.getElementById('groupsCardsGrid');
    if (!container) return;

    const groups = getFilteredGroups();
    const tabBadge = document.getElementById('tabBadgeGroups');
    if (tabBadge) tabBadge.textContent = groups.length;
    const metricCount = document.getElementById('metricGroupCount');
    if (metricCount) metricCount.textContent = groups.length;

    container.innerHTML = groups.map(grp => {
      const userCount = DB.users.filter(u => u.groupId === grp.id).length;
      const canEditGrp = hasPrivilege('edit_group');
      const canDisableGrp = hasPrivilege('disable_group');
      const canDeleteGrp = hasPrivilege('delete_group') && grp.id !== 'grp-super-admin';

      // Territorial purview summary
      let scopeDesc = '🌐 Global (Unrestricted)';
      if (grp.scope && (grp.scope.country !== 'ALL' || grp.scope.regionId !== 'ALL' || grp.scope.orgId !== 'ALL')) {
        const parts = [];
        if (grp.scope.country !== 'ALL') parts.push(grp.scope.country);
        if (grp.scope.regionId !== 'ALL') {
          const rName = DB.regions.find(r => r.id === grp.scope.regionId)?.name || grp.scope.regionId;
          parts.push(rName);
        }
        if (grp.scope.orgId !== 'ALL') {
          const oName = DB.organizations.find(o => o.id === grp.scope.orgId)?.name || grp.scope.orgId;
          parts.push(oName);
        }
        scopeDesc = `🔒 Scope: ${parts.join(' / ')}`;
      }

      const uCount = (grp.privileges.user_mgmt || []).length;
      const gCount = (grp.privileges.group_mgmt || []).length;
      const hCount = (grp.privileges.hierarchy_mgmt || []).length;
      const pCount = (grp.privileges.personal_info || []).length;
      
      const rcsTrig = grp.privileges.rcs_trigger?.allowed ? 
        (grp.privileges.rcs_trigger.allow_all ? 'Trigger: All' : `Trigger: ${grp.privileges.rcs_trigger.types?.length || 0} types`) : 'Trigger: None';

      const rcsRecv = grp.privileges.rcs_receive?.allowed ? 
        (grp.privileges.rcs_receive.allow_all ? 'Receive: All' : `Receive: ${grp.privileges.rcs_receive.types?.length || 0} types`) : 'Receive: None';

      return `
        <div class="group-card" data-id="${grp.id}">
          <div class="group-card-header">
            <div class="group-title-col">
              <span class="group-name">${grp.name}</span>
              <span class="group-codename">${grp.codeName}</span>
            </div>
            <span class="badge ${grp.status === 'active' ? 'badge-success' : 'badge-neutral'}">${grp.status}</span>
          </div>

          <p class="group-desc">${grp.description || 'No description provided.'}</p>

          <div class="group-meta-chips">
            <span class="scope-chip">👥 ${userCount} users</span>
            <span class="scope-chip">${scopeDesc}</span>
            <span class="scope-chip">🏷️ ${grp.category}</span>
          </div>

          <div class="privileges-summary">
            <div><strong>Privileges:</strong> ${uCount} User ops • ${gCount} Group ops • ${hCount} Hierarchy • ${pCount} Privacy</div>
            <div><strong>RCS Capabilities:</strong> ${rcsTrig} | ${rcsRecv}</div>
          </div>

          <div class="group-card-footer">
            <button class="btn btn-outline btn-sm btn-edit-group" data-id="${grp.id}" ${!canEditGrp ? 'disabled' : ''}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              <span>Edit</span>
            </button>
            <div style="display: flex; gap: 0.35rem;">
              <button class="btn btn-outline btn-sm btn-icon-only btn-toggle-group-status" data-id="${grp.id}" title="${grp.status === 'active' ? 'Disable' : 'Enable'}" ${!canDisableGrp ? 'disabled' : ''}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
              </button>
              <button class="btn btn-outline btn-sm btn-icon-only btn-delete-group" data-id="${grp.id}" title="Delete Group" ${!canDeleteGrp ? 'disabled' : ''} style="color: var(--danger);">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // =========================================================================
  // SECTION 9: HIERARCHY TREE (REGIONS, ORGS, SUB-ORGS)
  // =========================================================================

  /**
   * Renders the hierarchical tree structure:
   * Country ➔ Regions ➔ Organizations ➔ Sub-organizations.
   */
  function renderHierarchy() {
    const container = document.getElementById('hierarchyContainer');
    if (!container) return;

    const countries = [
      { code: 'CZ', name: 'Česká republika 🇨🇿' },
      { code: 'SK', name: 'Slovenská republika 🇸🇰' }
    ];

    const canManageReg = hasPrivilege('manage_regions');
    const canManageOrg = hasPrivilege('manage_organizations');
    const canManageSub = hasPrivilege('manage_sub_organizations');

    container.innerHTML = countries.map(country => {
      const regions = DB.regions.filter(r => r.country === country.code);

      return `
        <div class="toolbar-card" style="margin-bottom: 0;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 0.65rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 1.25rem;">${country.code === 'CZ' ? '🇨🇿' : '🇸🇰'}</span>
              <h4 style="font-size: 1.05rem; font-weight: 700;">${country.name}</h4>
              <span class="badge badge-neutral">${regions.length} Regions</span>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.75rem;">
            ${regions.map(reg => {
              const orgs = DB.organizations.filter(o => o.regionId === reg.id);
              return `
                <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.75rem; background: var(--bg-muted);">
                  <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <span style="font-weight: 700; font-size: 0.9rem;">📍 ${reg.name}</span>
                      <span class="badge badge-neutral">${reg.code}</span>
                      <span style="font-size: 0.75rem; color: var(--text-muted);">${orgs.length} organizations</span>
                    </div>
                    <div style="display: flex; gap: 0.35rem;">
                      <button class="btn btn-outline btn-sm btn-edit-region" data-id="${reg.id}" ${!canManageReg ? 'disabled' : ''}>Edit</button>
                      <button class="btn btn-outline btn-sm btn-delete-region" data-id="${reg.id}" ${!canManageReg ? 'disabled' : ''} style="color: var(--danger);">Remove</button>
                    </div>
                  </div>

                  <!-- Organizations within Region -->
                  <div class="tree-node">
                    ${orgs.map(org => {
                      const subs = DB.subOrganizations.filter(s => s.orgId === org.id);
                      const userCount = DB.users.filter(u => u.orgId === org.id).length;

                      return `
                        <div class="tree-item">
                          <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span style="font-weight: 600;">🏛️ ${org.name}</span>
                            <span class="badge badge-primary">${org.code}</span>
                            <span style="font-size: 0.725rem; color: var(--text-muted);">👥 ${userCount} users</span>
                          </div>
                          <div style="display: flex; gap: 0.35rem;">
                            <button class="btn btn-ghost btn-sm btn-edit-org" data-id="${org.id}" ${!canManageOrg ? 'disabled' : ''}>Edit</button>
                            <button class="btn btn-ghost btn-sm btn-delete-org" data-id="${org.id}" ${!canManageOrg ? 'disabled' : ''} style="color: var(--danger);">Remove</button>
                          </div>
                        </div>

                        <!-- Sub-organizations -->
                        <div class="tree-node" style="margin-bottom: 0.5rem;">
                          ${subs.map(sub => `
                            <div class="tree-item" style="background: var(--bg-surface); padding: 0.3rem 0.5rem;">
                              <div style="display: flex; align-items: center; gap: 0.4rem;">
                                <span style="font-size: 0.8rem;">↳ ${sub.name}</span>
                                <span class="badge badge-neutral" style="font-size: 0.65rem;">${sub.code}</span>
                              </div>
                              <div style="display: flex; gap: 0.25rem;">
                                <button class="btn btn-ghost btn-sm btn-edit-sub" data-id="${sub.id}" ${!canManageSub ? 'disabled' : ''}>Edit</button>
                                <button class="btn btn-ghost btn-sm btn-delete-sub" data-id="${sub.id}" ${!canManageSub ? 'disabled' : ''} style="color: var(--danger);">Remove</button>
                              </div>
                            </div>
                          `).join('')}
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  // =========================================================================
  // SECTION 10: RCS BUSINESS MESSAGING STUDIO (RULES 7 & 8)
  // =========================================================================

  /**
   * Configures and synchronizes the RCS Messaging Dispatcher.
   * Gating Rules:
   * - Senders must belong to a group with `rcs_trigger.allowed = true`.
   * - Available message types are restricted to sender group's permitted list.
   * - Recipient groups must possess `rcs_receive.allowed = true` for that type.
   */
  function renderRcsStudio() {
    const senderSelect = document.getElementById('rcsSenderGroupSelect');
    const typeSelect = document.getElementById('rcsMessageTypeSelect');
    const targetContainer = document.getElementById('rcsTargetGroupsContainer');
    const historyBody = document.getElementById('rcsHistoryTableBody');

    if (!senderSelect || !typeSelect || !targetContainer) return;

    // Filter groups allowed to dispatch
    const triggerGroups = DB.groups.filter(g => g.privileges.rcs_trigger?.allowed);
    senderSelect.innerHTML = triggerGroups.map(g => `
      <option value="${g.id}">${g.name} (${g.codeName})</option>
    `).join('');

    function updateAllowedTypes() {
      const selectedGid = senderSelect.value;
      const group = DB.groups.find(g => g.id === selectedGid);
      if (!group || !group.privileges.rcs_trigger?.allowed) {
        typeSelect.innerHTML = '<option disabled>Sender group has no trigger privileges</option>';
        return;
      }

      const trigConfig = group.privileges.rcs_trigger;
      let allowedTypeIds = trigConfig.allow_all ? DB.rcsMessageTypes.map(m => m.id) : (trigConfig.types || []);

      const availTypes = DB.rcsMessageTypes.filter(m => allowedTypeIds.includes(m.id));
      typeSelect.innerHTML = availTypes.map(m => `
        <option value="${m.id}">[${m.category}] ${m.name} — ${m.description}</option>
      `).join('');

      updateRecipientGroups();
      updateRcsPreview();
    }

    function updateRecipientGroups() {
      const activeTypeId = typeSelect.value;
      const receiveGroups = DB.groups.filter(g => {
        const rc = g.privileges.rcs_receive;
        if (!rc || !rc.allowed) return false;
        if (rc.allow_all) return true;
        return (rc.types || []).includes(activeTypeId);
      });

      targetContainer.innerHTML = receiveGroups.map(g => `
        <label class="checkbox-label" style="background: var(--bg-surface); padding: 0.25rem 0.5rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
          <input type="checkbox" class="custom-checkbox rcs-target-check" value="${g.id}" checked>
          <span>${g.name} (${g.codeName})</span>
        </label>
      `).join('');
    }

    senderSelect.onchange = updateAllowedTypes;
    typeSelect.onchange = () => {
      updateRecipientGroups();
      updateRcsPreview();
    };

    updateAllowedTypes();

    // Render historical dispatch log
    if (historyBody) {
      historyBody.innerHTML = DB.rcsLogs.map(log => {
        const sGroup = DB.groups.find(g => g.id === log.senderGroupId)?.name || log.senderGroupId;
        const mType = DB.rcsMessageTypes.find(m => m.id === log.typeId)?.name || log.typeId;
        const count = log.recipientGroupIds?.length || 0;

        return `
          <tr>
            <td style="font-size: 0.75rem; color: var(--text-muted);">${new Date(log.timestamp).toLocaleTimeString()}</td>
            <td><strong>${sGroup}</strong></td>
            <td><span class="badge badge-primary">${mType}</span></td>
            <td>${log.title}</td>
            <td>${count} Target Groups</td>
            <td><span class="badge badge-success">${log.status}</span></td>
          </tr>
        `;
      }).join('');
    }
  }

  /**
   * Updates the smartphone visual mockup in real time.
   */
  function updateRcsPreview() {
    const title = document.getElementById('rcsMsgTitle')?.value || 'System Notice';
    const body = document.getElementById('rcsMsgBody')?.value || '';
    const btnText = document.getElementById('rcsActionBtnLabel')?.value || 'Acknowledge';
    const typeSelect = document.getElementById('rcsMessageTypeSelect');
    const activeTypeName = typeSelect?.options[typeSelect.selectedIndex]?.text.split('—')[0] || 'Notification';

    const pTitle = document.getElementById('rcsMockTitle');
    const pBody = document.getElementById('rcsMockBody');
    const pBtn = document.getElementById('rcsMockActionButton');
    const pBadge = document.getElementById('rcsMockTypeBadge');

    if (pTitle) pTitle.textContent = title;
    if (pBody) pBody.textContent = body;
    if (pBtn) pBtn.textContent = btnText;
    if (pBadge) pBadge.textContent = activeTypeName;
  }

  // =========================================================================
  // SECTION 11: AUDIT TRAIL LOGGING
  // =========================================================================

  /**
   * Renders the live security audit events table.
   */
  function renderAuditLogs() {
    const tableBody = document.getElementById('auditLogsTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = DB.auditLogs.map(log => `
      <tr>
        <td style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted);">${new Date(log.timestamp).toLocaleString()}</td>
        <td><strong>${log.actor}</strong></td>
        <td><span class="badge badge-primary">${log.action}</span></td>
        <td>${log.entity}</td>
        <td><span class="badge ${log.status === 'Success' ? 'badge-success' : 'badge-danger'}">${log.status}</span></td>
      </tr>
    `).join('');
  }

  // =========================================================================
  // SECTION 12: FLOATING TESTING SIMULATOR (DRAGGABLE & MINIMIZABLE)
  // =========================================================================

  /**
   * Initializes drag-and-drop pointer physics and minimize toggles
   * for the "FOR TESTING PURPOSES ONLY" floating panel.
   */
  function setupFloatingTestingPanel() {
    const panel = document.getElementById('floatingTestPanel');
    const header = document.getElementById('testPanelHeader');
    const btnMin = document.getElementById('btnMinimizeTestPanel');
    const btnClose = document.getElementById('btnToggleTestPanelVisibility');
    const dockBtn = document.getElementById('floatingTestDockBtn');

    if (!panel || !header) return;

    let isDragging = false;
    let startX = 0, startY = 0;
    let initialLeft = 0, initialTop = 0;

    header.addEventListener('mousedown', startDrag);
    header.addEventListener('touchstart', startDrag, { passive: false });

    function startDrag(e) {
      if (e.target.closest('.test-panel-btn')) return;
      isDragging = true;
      const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
      const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

      startX = clientX;
      startY = clientY;

      const rect = panel.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;

      panel.style.bottom = 'auto';
      panel.style.right = 'auto';
      panel.style.left = initialLeft + 'px';
      panel.style.top = initialTop + 'px';

      document.addEventListener('mousemove', onDrag);
      document.addEventListener('touchmove', onDrag, { passive: false });
      document.addEventListener('mouseup', stopDrag);
      document.addEventListener('touchend', stopDrag);
      e.preventDefault();
    }

    function onDrag(e) {
      if (!isDragging) return;
      const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
      const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

      const dx = clientX - startX;
      const dy = clientY - startY;

      let newLeft = initialLeft + dx;
      let newTop = initialTop + dy;

      // Keep within screen boundaries
      const pad = 10;
      newLeft = Math.max(pad, Math.min(window.innerWidth - panel.offsetWidth - pad, newLeft));
      newTop = Math.max(pad, Math.min(window.innerHeight - panel.offsetHeight - pad, newTop));

      panel.style.left = newLeft + 'px';
      panel.style.top = newTop + 'px';
      e.preventDefault();
    }

    function stopDrag() {
      isDragging = false;
      document.removeEventListener('mousemove', onDrag);
      document.removeEventListener('touchmove', onDrag);
      document.removeEventListener('mouseup', stopDrag);
      document.removeEventListener('touchend', stopDrag);
    }

    if (btnMin) {
      btnMin.onclick = () => {
        panel.classList.toggle('minimized');
        btnMin.textContent = panel.classList.contains('minimized') ? '+' : '−';
      };
    }

    if (btnClose) {
      btnClose.onclick = () => {
        panel.style.display = 'none';
        if (dockBtn) dockBtn.style.display = 'flex';
      };
    }

    if (dockBtn) {
      dockBtn.onclick = () => {
        panel.style.display = 'flex';
        panel.classList.remove('minimized');
        dockBtn.style.display = 'none';
      };
    }
  }

  /**
   * Refreshes the breakdown of granted and restricted permissions
   * displayed within the testing panel.
   */
  function renderTestingPanel() {
    const user = currentUser;
    const group = getCurrentGroup();

    const pUser = document.getElementById('testPanelUserName');
    const pGroup = document.getElementById('testPanelGroupName');
    const pCode = document.getElementById('testPanelGroupCode');
    const pScope = document.getElementById('testPanelScopeText');
    const pList = document.getElementById('testPermsList');
    const dockShort = document.getElementById('dockUserShort');

    if (pUser) pUser.textContent = user.name;
    if (pGroup) pGroup.textContent = group.name;
    if (pCode) pCode.textContent = group.codeName;
    if (dockShort) dockShort.textContent = `${user.firstName} (${group.codeName})`;

    let scopeDesc = 'Scope: Global (Unrestricted)';
    if (group.scope && (group.scope.country !== 'ALL' || group.scope.regionId !== 'ALL' || group.scope.orgId !== 'ALL')) {
      const parts = [];
      if (group.scope.country !== 'ALL') parts.push(group.scope.country);
      if (group.scope.regionId !== 'ALL') parts.push(DB.regions.find(r => r.id === group.scope.regionId)?.name || 'Region');
      if (group.scope.orgId !== 'ALL') parts.push(DB.organizations.find(o => o.id === group.scope.orgId)?.name || 'Org');
      scopeDesc = `Scope: ${parts.join(' > ')}`;
    }
    if (pScope) pScope.textContent = scopeDesc;

    if (pList) {
      const allCheckKeys = [
        { key: 'create_group', label: 'Create Grp' },
        { key: 'edit_group', label: 'Edit Grp' },
        { key: 'delete_group', label: 'Delete Grp' },
        { key: 'create_user', label: 'Create Usr' },
        { key: 'edit_user', label: 'Edit Usr' },
        { key: 'delete_user', label: 'Delete Usr' },
        { key: 'bulk_edit_users', label: 'Bulk Usr' },
        { key: 'import_users', label: 'Import XLS' },
        { key: 'view_others_personal', label: 'View Privacy' },
        { key: 'edit_others_personal', label: 'Edit Privacy' },
        { key: 'change_password', label: 'Change Pwd' },
        { key: 'manage_organizations', label: 'Manage Orgs' }
      ];

      pList.innerHTML = allCheckKeys.map(k => {
        const granted = hasPrivilege(k.key);
        return `
          <span class="test-perm-pill ${granted ? 'granted' : 'denied'}" title="${granted ? 'Granted' : 'Denied / Restricted'}">
            ${granted ? '✓' : '✕'} ${k.label}
          </span>
        `;
      }).join('');
    }
  }

  /**
   * Switches the active simulation session to another user account.
   * Immediately re-evaluates all scoped UI views and permissions.
   * @param {string} userId - Target user identifier
   */
  function switchActiveUser(userId) {
    const user = DB.users.find(u => u.id === userId);
    if (!user) return;

    currentUser = user;
    userPagination.page = 1;
    selectedUserIds.clear();

    renderHeader();
    renderUsersTable();
    renderGroupsGrid();
    renderHierarchy();
    renderRcsStudio();

    addAuditLog('Persona Switch', `Simulated login as ${user.name} (${getCurrentGroup().codeName})`);
    showToast(`Simulating active session as: ${user.name} (${getCurrentGroup().name})`, 'info');
  }

  /**
   * Restores God Mode (Super Administrator persona with all privileges unrestricted).
   */
  function activateGodMode() {
    const godUser = DB.users.find(u => u.groupId === 'grp-super-admin') || DB.users[0];
    switchActiveUser(godUser.id);
    showToast(`👁️⃤ God Mode Activated! Unrestricted super administrator session restored.`, 'success');
  }

  // =========================================================================
  // SECTION 13: USER MODALS (CREATE & EDIT)
  // =========================================================================

  /**
   * Opens the Create/Edit User modal dialog.
   * @param {Object|null} user - Existing user or null for new creation
   */
  function openUserModal(user = null) {
    const modal = document.getElementById('modalUser');
    const title = document.getElementById('modalUserTitle');
    const form = document.getElementById('formUser');
    if (!modal || !form) return;

    form.reset();
    populateHierarchySelects();

    const groupSelect = document.getElementById('userGroupSelect');
    if (groupSelect) {
      groupSelect.innerHTML = DB.groups.map(g => `
        <option value="${g.id}">${g.name} (${g.codeName})</option>
      `).join('');
    }

    if (user) {
      title.textContent = `Edit User: ${user.name}`;
      document.getElementById('userIdInput').value = user.id;
      document.getElementById('userFirstName').value = user.firstName;
      document.getElementById('userLastName').value = user.lastName;
      document.getElementById('userEmail').value = user.email;
      document.getElementById('userUsername').value = user.username;
      document.getElementById('userPhone').value = user.phone;
      document.getElementById('userRegionSelect').value = user.regionId;
      document.getElementById('userOrgSelect').value = user.orgId;
      document.getElementById('userSubOrgSelect').value = user.subOrgId || '';
      document.getElementById('userGroupSelect').value = user.groupId;
      document.getElementById('userStatusSelect').value = user.status;

      if (user.personalInfo) {
        document.getElementById('userDob').value = user.personalInfo.dateOfBirth || '';
        document.getElementById('userNationalId').value = user.personalInfo.nationalId || '';
        document.getElementById('userAddress').value = user.personalInfo.address || '';
        document.getElementById('userEmergencyContact').value = user.personalInfo.emergencyContact || '';
      }
    } else {
      title.textContent = 'Create New User';
      document.getElementById('userIdInput').value = '';
      document.getElementById('userPhone').value = '+421 905 ';
    }

    modal.classList.add('active');
  }

  /**
   * Dynamically cascades Region ➔ Organization ➔ Sub-organization selections.
   */
  function populateHierarchySelects() {
    const regSelect = document.getElementById('userRegionSelect');
    const orgSelect = document.getElementById('userOrgSelect');
    const subSelect = document.getElementById('userSubOrgSelect');

    if (regSelect) {
      regSelect.innerHTML = DB.regions.map(r => `
        <option value="${r.id}">[${r.country}] ${r.name}</option>
      `).join('');
    }

    function updateOrgs() {
      const regId = regSelect.value;
      const filteredOrgs = DB.organizations.filter(o => o.regionId === regId);
      if (orgSelect) {
        orgSelect.innerHTML = filteredOrgs.map(o => `
          <option value="${o.id}">${o.name} (${o.code})</option>
        `).join('');
      }
      updateSubs();
    }

    function updateSubs() {
      const orgId = orgSelect ? orgSelect.value : '';
      const filteredSubs = DB.subOrganizations.filter(s => s.orgId === orgId);
      if (subSelect) {
        subSelect.innerHTML = '<option value="">— None / Central —</option>' + filteredSubs.map(s => `
          <option value="${s.id}">${s.name} (${s.code})</option>
        `).join('');
      }
    }

    if (regSelect) regSelect.onchange = updateOrgs;
    if (orgSelect) orgSelect.onchange = updateSubs;
    updateOrgs();
  }

  /**
   * Handles user creation and mutation submission.
   * Enforces mandatory phone validation rule (+420 / +421 area code).
   * @param {Event} e - Submit event
   */
  function handleSaveUser(e) {
    e.preventDefault();
    const id = document.getElementById('userIdInput').value;
    const first = document.getElementById('userFirstName').value.trim();
    const last = document.getElementById('userLastName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const username = document.getElementById('userUsername').value.trim();
    const rawPhone = document.getElementById('userPhone').value.trim();
    const formattedPhone = formatPhoneNumber(rawPhone);

    // Rule 0.0: Mandatory Unified Phone Number Validation
    if (!validatePhoneNumber(formattedPhone)) {
      showToast('Mandatory phone format error! Must be unified: +420 XXX XXX XXX or +421 XXX XXX XXX', 'danger');
      return;
    }

    const regId = document.getElementById('userRegionSelect').value;
    const orgId = document.getElementById('userOrgSelect').value;
    const subOrgId = document.getElementById('userSubOrgSelect').value;
    const groupId = document.getElementById('userGroupSelect').value;
    const status = document.getElementById('userStatusSelect').value;
    const country = regId.startsWith('reg-cz') ? 'CZ' : 'SK';

    const personalInfo = {
      dateOfBirth: document.getElementById('userDob').value,
      nationalId: document.getElementById('userNationalId').value,
      address: document.getElementById('userAddress').value,
      emergencyContact: document.getElementById('userEmergencyContact').value,
      bio: 'Simulated user record.'
    };

    if (id) {
      const user = DB.users.find(u => u.id === id);
      if (user) {
        user.firstName = first;
        user.lastName = last;
        user.name = `${first} ${last}`;
        user.email = email;
        user.username = username;
        user.phone = formattedPhone;
        user.regionId = regId;
        user.orgId = orgId;
        user.subOrgId = subOrgId;
        user.groupId = groupId;
        user.status = status;
        user.country = country;
        user.personalInfo = personalInfo;

        addAuditLog('User Update', `Updated user ${user.name}`);
        showToast(`User ${user.name} successfully updated.`, 'success');
      }
    } else {
      const newUser = {
        id: `usr-${String(DB.users.length + 1).padStart(3, '0')}`,
        username,
        name: `${first} ${last}`,
        firstName: first,
        lastName: last,
        email,
        phone: formattedPhone,
        country,
        regionId: regId,
        orgId,
        subOrgId,
        groupId,
        status,
        personalInfo,
        passwordHash: 'argon2id$default',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      DB.users.unshift(newUser);
      addAuditLog('User Creation', `Created user ${newUser.name}`);
      showToast(`User ${newUser.name} created successfully.`, 'success');
    }

    saveDB();
    document.getElementById('modalUser').classList.remove('active');
    renderUsersTable();
  }

  // =========================================================================
  // SECTION 14: GROUP MODALS & DUPLICATE PROTECTION
  // =========================================================================

  /**
   * Opens the Create/Edit Group modal dialog.
   * @param {Object|null} group - Existing group or null for creation
   */
  function openGroupModal(group = null) {
    const modal = document.getElementById('modalGroup');
    const title = document.getElementById('modalGroupTitle');
    const form = document.getElementById('formGroup');
    if (!modal || !form) return;

    form.reset();

    const scopeReg = document.getElementById('groupScopeRegion');
    const scopeOrg = document.getElementById('groupScopeOrg');
    const scopeSub = document.getElementById('groupScopeSubOrg');

    if (scopeReg) {
      scopeReg.innerHTML = '<option value="ALL">All Regions (Unrestricted)</option>' + DB.regions.map(r => `
        <option value="${r.id}">[${r.country}] ${r.name}</option>
      `).join('');
    }
    if (scopeOrg) {
      scopeOrg.innerHTML = '<option value="ALL">All Organizations</option>' + DB.organizations.map(o => `
        <option value="${o.id}">${o.name}</option>
      `).join('');
    }
    if (scopeSub) {
      scopeSub.innerHTML = '<option value="ALL">All Sub-organizations</option>' + DB.subOrganizations.map(s => `
        <option value="${s.id}">${s.name}</option>
      `).join('');
    }

    renderRcsPillSelectors();

    if (group) {
      title.textContent = `Edit Group: ${group.name}`;
      document.getElementById('groupIdInput').value = group.id;
      document.getElementById('groupNameInput').value = group.name;
      document.getElementById('groupCodenameInput').value = group.codeName;
      document.getElementById('groupCategoryInput').value = group.category;
      document.getElementById('groupDescInput').value = group.description || '';

      if (group.scope) {
        document.getElementById('groupScopeCountry').value = group.scope.country || 'ALL';
        document.getElementById('groupScopeRegion').value = group.scope.regionId || 'ALL';
        document.getElementById('groupScopeOrg').value = group.scope.orgId || 'ALL';
        document.getElementById('groupScopeSubOrg').value = group.scope.subOrgId || 'ALL';
      }

      setPrivilegeCheckboxes(group.privileges);
    } else {
      title.textContent = 'Create New Group';
      document.getElementById('groupIdInput').value = '';
    }

    modal.classList.add('active');
  }

  /**
   * Renders the 10 RCS pill buttons for message category selection.
   */
  function renderRcsPillSelectors() {
    const trigContainer = document.getElementById('rcsTriggerTypesList');
    const recvContainer = document.getElementById('rcsReceiveTypesList');

    if (trigContainer) {
      trigContainer.innerHTML = DB.rcsMessageTypes.map(m => `
        <div class="rcs-pill" data-type-id="${m.id}" data-target="trig">
          ${m.name}
        </div>
      `).join('');
    }

    if (recvContainer) {
      recvContainer.innerHTML = DB.rcsMessageTypes.map(m => `
        <div class="rcs-pill" data-type-id="${m.id}" data-target="recv">
          ${m.name}
        </div>
      `).join('');
    }
  }

  /**
   * Aggregates privilege selections from the group creation modal.
   * @returns {Object} Privileges object
   */
  function getPrivilegesFromForm() {
    const getChecked = containerId => {
      const container = document.getElementById(containerId);
      if (!container) return [];
      return Array.from(container.querySelectorAll('.priv-check:checked')).map(c => c.value);
    };

    const trigAllowed = document.getElementById('rcsTriggerAllowedCheck')?.checked || false;
    const trigAll = document.getElementById('rcsTriggerAllRadio')?.checked || false;
    const trigTypes = trigAllowed ? 
      (trigAll ? DB.rcsMessageTypes.map(m => m.id) : 
        Array.from(document.querySelectorAll('#rcsTriggerTypesList .rcs-pill.selected')).map(p => p.dataset.typeId)) : [];

    const recvAllowed = document.getElementById('rcsReceiveAllowedCheck')?.checked || false;
    const recvAll = document.getElementById('rcsReceiveAllRadio')?.checked || false;
    const recvTypes = recvAllowed ? 
      (recvAll ? DB.rcsMessageTypes.map(m => m.id) : 
        Array.from(document.querySelectorAll('#rcsReceiveTypesList .rcs-pill.selected')).map(p => p.dataset.typeId)) : [];

    return {
      group_mgmt: getChecked('grp-priv-group'),
      user_mgmt: getChecked('grp-priv-user'),
      hierarchy_mgmt: getChecked('grp-priv-hierarchy'),
      personal_info: getChecked('grp-priv-personal'),
      rcs_trigger: {
        allowed: trigAllowed && (trigAll || trigTypes.length > 0),
        allow_all: trigAll,
        types: trigTypes
      },
      rcs_receive: {
        allowed: recvAllowed && (recvAll || recvTypes.length > 0),
        allow_all: recvAll,
        types: recvTypes
      }
    };
  }

  /**
   * Syncs existing group privileges onto form checkboxes and pill states.
   * @param {Object} privileges - Privileges schema
   */
  function setPrivilegeCheckboxes(privileges) {
    if (!privileges) return;
    document.querySelectorAll('.priv-check').forEach(chk => {
      const val = chk.value;
      chk.checked = false;
      for (const cat in privileges) {
        if (Array.isArray(privileges[cat]) && privileges[cat].includes(val)) {
          chk.checked = true;
        }
      }
    });

    // RCS Trigger controls
    const trigAllowedCheck = document.getElementById('rcsTriggerAllowedCheck');
    const trigOptionsBlock = document.getElementById('rcsTriggerOptionsBlock');
    const trigTypesList = document.getElementById('rcsTriggerTypesList');
    if (trigAllowedCheck) {
      trigAllowedCheck.checked = Boolean(privileges.rcs_trigger?.allowed);
      if (trigOptionsBlock) trigOptionsBlock.style.display = trigAllowedCheck.checked ? 'flex' : 'none';
      if (privileges.rcs_trigger?.allow_all) {
        document.getElementById('rcsTriggerAllRadio').checked = true;
        if (trigTypesList) trigTypesList.style.display = 'none';
      } else {
        document.getElementById('rcsTriggerSomeRadio').checked = true;
        if (trigTypesList) trigTypesList.style.display = 'flex';
      }
      const types = privileges.rcs_trigger?.types || [];
      document.querySelectorAll('#rcsTriggerTypesList .rcs-pill').forEach(pill => {
        pill.classList.toggle('selected', types.includes(pill.dataset.typeId));
      });
    }

    // RCS Receive controls
    const recvAllowedCheck = document.getElementById('rcsReceiveAllowedCheck');
    const recvOptionsBlock = document.getElementById('rcsReceiveOptionsBlock');
    const recvTypesList = document.getElementById('rcsReceiveTypesList');
    if (recvAllowedCheck) {
      recvAllowedCheck.checked = Boolean(privileges.rcs_receive?.allowed);
      if (recvOptionsBlock) recvOptionsBlock.style.display = recvAllowedCheck.checked ? 'flex' : 'none';
      if (privileges.rcs_receive?.allow_all) {
        document.getElementById('rcsReceiveAllRadio').checked = true;
        if (recvTypesList) recvTypesList.style.display = 'none';
      } else {
        document.getElementById('rcsReceiveSomeRadio').checked = true;
        if (recvTypesList) recvTypesList.style.display = 'flex';
      }
      const types = privileges.rcs_receive?.types || [];
      document.querySelectorAll('#rcsReceiveTypesList .rcs-pill').forEach(pill => {
        pill.classList.toggle('selected', types.includes(pill.dataset.typeId));
      });
    }
  }

  /**
   * Saves a group while checking against duplicate privileges across existing groups.
   * @param {Event} e - Form submission event
   */
  function handleSaveGroup(e) {
    e.preventDefault();
    const id = document.getElementById('groupIdInput').value;
    const name = document.getElementById('groupNameInput').value.trim();
    const codeName = document.getElementById('groupCodenameInput').value.trim().toUpperCase();
    const category = document.getElementById('groupCategoryInput').value;
    const desc = document.getElementById('groupDescInput').value.trim();

    const scope = {
      country: document.getElementById('groupScopeCountry').value,
      regionId: document.getElementById('groupScopeRegion').value,
      orgId: document.getElementById('groupScopeOrg').value,
      subOrgId: document.getElementById('groupScopeSubOrg').value
    };

    const privileges = getPrivilegesFromForm();

    // Enforce Rule: Warn and DO NOT ALLOW if there is already a group with these exact privileges
    const duplicate = checkDuplicatePrivileges(privileges, id || null);
    const alertBox = document.getElementById('duplicatePrivilegeAlert');
    const alertMsg = document.getElementById('duplicatePrivilegeMsg');

    if (duplicate) {
      if (alertBox && alertMsg) {
        alertMsg.innerHTML = `Group <strong>"${duplicate.name}" (${duplicate.codeName})</strong> already has this exact set of privileges. Group creation is blocked to maintain clean, non-redundant roles.`;
        alertBox.style.display = 'block';
      }
      showToast(`Creation blocked! Identical privileges already belong to group "${duplicate.name}".`, 'danger');
      return;
    } else {
      if (alertBox) alertBox.style.display = 'none';
    }

    if (id) {
      const grp = DB.groups.find(g => g.id === id);
      if (grp) {
        grp.name = name;
        grp.codeName = codeName;
        grp.category = category;
        grp.description = desc;
        grp.scope = scope;
        grp.privileges = privileges;

        addAuditLog('Group Update', `Updated group ${grp.name}`);
        showToast(`Group ${grp.name} updated successfully.`, 'success');
      }
    } else {
      const newGrp = {
        id: `grp-${Date.now().toString(36)}`,
        name,
        codeName,
        category,
        description: desc,
        status: 'active',
        scope,
        privileges
      };
      DB.groups.push(newGrp);
      addAuditLog('Group Creation', `Created group ${newGrp.name}`);
      showToast(`Group ${newGrp.name} created successfully.`, 'success');
    }

    saveDB();
    document.getElementById('modalGroup').classList.remove('active');
    renderGroupsGrid();
    renderRcsStudio();
  }

  // =========================================================================
  // SECTION 15: CSV / XLS USER IMPORT (RULE 3.2)
  // =========================================================================

  /**
   * Opens the file import modal dialog.
   */
  function openImportModal() {
    const modal = document.getElementById('modalImport');
    const targetSelect = document.getElementById('importTargetGroup');
    if (!modal || !targetSelect) return;

    targetSelect.innerHTML = DB.groups.map(g => `
      <option value="${g.id}">${g.name} (${g.codeName})</option>
    `).join('');

    document.getElementById('importPreviewContainer').style.display = 'none';
    document.getElementById('btnCommitImport').disabled = true;
    stagedImportUsers = [];

    modal.classList.add('active');
  }

  /**
   * Reads raw file bytes and sends text content to parser.
   * @param {File} file - Browser file object
   */
  function handleCsvFile(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const text = e.target.result;
      parseAndValidateCsv(text);
    };
    reader.readAsText(file);
  }

  /**
   * Line-by-line CSV parser with phone normalization and validation.
   * Highlights valid vs error rows in live preview before commit.
   * @param {string} text - Raw CSV content
   */
  function parseAndValidateCsv(text) {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      showToast('CSV must contain a header and at least one user record.', 'warning');
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const validRows = [];
    const previewTableBody = document.getElementById('importPreviewTableBody');
    previewTableBody.innerHTML = '';

    let validCount = 0;
    let errorCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      if (cols.length < 3) continue;

      const first = cols[0] || '';
      const last = cols[1] || '';
      const email = cols[2] || '';
      const rawPhone = cols[3] || '';
      const formattedPhone = formatPhoneNumber(rawPhone);
      const regCode = cols[4] || 'PRG';

      const errors = [];
      if (!first || !last) errors.push('Missing name');
      if (!email.includes('@')) errors.push('Invalid email');
      if (!validatePhoneNumber(formattedPhone)) {
        errors.push('Phone mandatory format invalid (+420/+421 XXX XXX XXX)');
      }

      const isValid = errors.length === 0;
      if (isValid) validCount++; else errorCount++;

      const region = DB.regions.find(r => r.code === regCode) || DB.regions[0];
      const org = DB.organizations.find(o => o.regionId === region.id) || DB.organizations[0];

      const record = {
        firstName: first,
        lastName: last,
        name: `${first} ${last}`,
        email,
        phone: formattedPhone,
        country: region.country,
        regionId: region.id,
        orgId: org.id,
        subOrgId: '',
        status: 'active',
        isValid,
        errors
      };

      if (isValid) validRows.push(record);

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="badge ${isValid ? 'badge-success' : 'badge-danger'}">${isValid ? 'Valid' : 'Error'}</span></td>
        <td>${first} ${last}</td>
        <td>${email}</td>
        <td><span class="phone-formatted">${formattedPhone}</span></td>
        <td>${region.name}</td>
        <td style="color: var(--danger); font-size: 0.75rem;">${errors.join(', ')}</td>
      `;
      previewTableBody.appendChild(tr);
    }

    stagedImportUsers = validRows;
    document.getElementById('importValidCount').textContent = validCount;
    document.getElementById('importInvalidCount').textContent = errorCount;
    document.getElementById('importPreviewContainer').style.display = 'block';
    document.getElementById('btnCommitImport').disabled = validRows.length === 0;
  }

  /**
   * Commits the validated staging user roster into the master database.
   */
  function commitImportUsers() {
    if (stagedImportUsers.length === 0) return;
    const targetGroupId = document.getElementById('importTargetGroup').value;

    let added = 0;
    stagedImportUsers.forEach((rec, idx) => {
      const newUser = {
        id: `usr-imp-${Date.now()}-${idx}`,
        username: `${rec.firstName.toLowerCase()}.${rec.lastName.toLowerCase()}${Math.floor(Math.random() * 899 + 100)}`,
        name: rec.name,
        firstName: rec.firstName,
        lastName: rec.lastName,
        email: rec.email,
        phone: rec.phone,
        country: rec.country,
        regionId: rec.regionId,
        orgId: rec.orgId,
        subOrgId: rec.subOrgId,
        groupId: targetGroupId,
        status: 'active',
        personalInfo: {
          dateOfBirth: '1995-01-01',
          address: 'Imported Record',
          nationalId: '—',
          emergencyContact: rec.phone
        },
        passwordHash: 'argon2id$imported',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      DB.users.unshift(newUser);
      added++;
    });

    saveDB();
    document.getElementById('modalImport').classList.remove('active');
    renderUsersTable();
    addAuditLog('Batch Import', `Imported ${added} users into group ${targetGroupId}`);
    showToast(`Successfully imported ${added} users with validated mandatory phone numbers!`, 'success');
  }

  /**
   * Generates and downloads a sample CSV file pre-formatted with unified phones.
   */
  function downloadSampleCsv() {
    const csvContent = 
`first_name,last_name,email,mandatory_phone,region_code
Matej,Sopko,matej.sopko@edusk.sk,+421 905 444 888,BA
Klára,Horáková,klara.horakova@educz.org,+420 777 222 333,PRG
Jozef,Baláž,jozef.balaz@uniba.sk,+421 910 888 999,KE
Tereza,Dvořáková,tereza.dvorakova@cuni.cz,+420 602 123 456,JHM
`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'aegis_users_import_template.csv';
    link.click();
  }

  // =========================================================================
  // SECTION 16: PASSWORD LIFECYCLE (RULES 6.5, 6.6, 6.7)
  // =========================================================================

  /**
   * Opens the password modal with custom password, generator, or recovery OTP modes.
   * @param {string} userId - Target user ID
   */
  function openPasswordModal(userId) {
    const user = DB.users.find(u => u.id === userId);
    if (!user) return;

    const modal = document.getElementById('modalPassword');
    const title = document.getElementById('pwdModalTitle');
    const targetInput = document.getElementById('pwdTargetUserId');
    const phoneDisplay = document.getElementById('recoveryPhoneDisplay');

    if (!modal) return;

    title.textContent = `Manage Password for ${user.name}`;
    targetInput.value = user.id;
    if (phoneDisplay) phoneDisplay.value = user.phone;

    switchPwdMode('change');
    generateCryptoPassword();

    modal.classList.add('active');
  }

  function switchPwdMode(mode) {
    document.querySelectorAll('.pwd-tab-btn').forEach(btn => {
      btn.classList.toggle('btn-primary', btn.dataset.pwdMode === mode);
      btn.classList.toggle('btn-outline', btn.dataset.pwdMode !== mode);
    });

    document.querySelectorAll('.pwd-mode-view').forEach(view => view.style.display = 'none');
    if (mode === 'change') document.getElementById('pwdModeChange').style.display = 'block';
    if (mode === 'generate') document.getElementById('pwdModeGenerate').style.display = 'block';
    if (mode === 'retrieve') document.getElementById('pwdModeRetrieve').style.display = 'block';
  }

  /**
   * Generates a high-entropy 16-character cryptographic random password.
   */
  function generateCryptoPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*+=-';
    let pwd = '';
    const array = new Uint32Array(16);
    crypto.getRandomValues(array);
    for (let i = 0; i < 16; i++) {
      pwd += chars[array[i] % chars.length];
    }
    const input = document.getElementById('generatedPwdInput');
    if (input) input.value = pwd;
  }

  /**
   * Evaluates and updates password strength score indicators.
   * @param {string} val - Entered password
   */
  function evaluatePasswordStrength(val) {
    const bar = document.getElementById('pwdStrengthBar');
    const text = document.getElementById('pwdStrengthText');
    if (!bar || !text) return;

    let score = 0;
    if (val.length >= 8) score++;
    if (val.length >= 12) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    const colors = ['#ef4444', '#f97316', '#eab308', '#10b981', '#059669'];
    const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong (Entropy High)'];

    if (val.length === 0) {
      bar.style.width = '0%';
      text.textContent = 'Strength: Enter password';
    } else {
      const idx = Math.min(score, 4);
      bar.style.width = `${(idx + 1) * 20}%`;
      bar.style.background = colors[idx];
      text.textContent = `Strength: ${labels[idx]}`;
    }
  }

  // =========================================================================
  // SECTION 17: REBRANDING & DYNAMIC THEMES
  // =========================================================================

  const THEME_PRESETS = [
    { name: 'Nordic Slate', hue: 221, sat: 83, lit: 53, hex: '#2563eb' },
    { name: 'Obsidian & Minimal', hue: 240, sat: 5, lit: 26, hex: '#404048' },
    { name: 'Alpine Emerald', hue: 160, sat: 84, lit: 39, hex: '#10b981' },
    { name: 'Oceanic Azure', hue: 199, sat: 89, lit: 48, hex: '#0284c7' },
    { name: 'Warm Terracotta', hue: 24, sat: 85, lit: 53, hex: '#ea580c' },
    { name: 'Royal Amethyst', hue: 262, sat: 83, lit: 58, hex: '#7c3aed' }
  ];

  /**
   * Initializes the slide-over drawer for rebranding colors, fonts & borders.
   */
  function setupRebrandDrawer() {
    const drawer = document.getElementById('rebrandDrawer');
    const backdrop = document.getElementById('rebrandDrawerBackdrop');
    const btnOpen = document.getElementById('btnOpenRebrand');
    const btnClose = document.getElementById('btnCloseRebrand');
    const presetsGrid = document.getElementById('colorPresetsGrid');
    const colorPicker = document.getElementById('customColorPicker');
    const colorHex = document.getElementById('customColorHex');
    const fontSelect = document.getElementById('fontFamilySelect');

    if (presetsGrid) {
      presetsGrid.innerHTML = THEME_PRESETS.map(p => `
        <div class="color-preset-card" data-hue="${p.hue}" data-sat="${p.sat}" data-lit="${p.lit}" data-hex="${p.hex}">
          <div class="color-circle" style="background: ${p.hex};"></div>
          <span style="font-size: 0.725rem; font-weight: 600;">${p.name}</span>
        </div>
      `).join('');

      presetsGrid.querySelectorAll('.color-preset-card').forEach(card => {
        card.onclick = () => {
          presetsGrid.querySelectorAll('.color-preset-card').forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          applyBrandColor(card.dataset.hue, card.dataset.sat + '%', card.dataset.lit + '%');
          if (colorPicker) colorPicker.value = card.dataset.hex;
          if (colorHex) colorHex.value = card.dataset.hex;
        };
      });
    }

    if (btnOpen) btnOpen.onclick = () => {
      drawer.classList.add('open');
      backdrop.classList.add('active');
    };

    if (btnClose) btnClose.onclick = closeDrawer;
    if (backdrop) backdrop.onclick = closeDrawer;

    function closeDrawer() {
      drawer.classList.remove('open');
      backdrop.classList.remove('active');
    }

    if (colorPicker) {
      colorPicker.oninput = (e) => {
        const hex = e.target.value;
        if (colorHex) colorHex.value = hex;
        applyHexColor(hex);
      };
    }

    if (fontSelect) {
      fontSelect.onchange = (e) => {
        document.documentElement.style.setProperty('--font-sans', e.target.value);
        localStorage.setItem('aegis_font', e.target.value);
      };
    }

    document.querySelectorAll('.radius-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.radius-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const r = btn.dataset.radius;
        if (r === 'sharp') {
          document.documentElement.style.setProperty('--radius-sm', '0px');
          document.documentElement.style.setProperty('--radius-md', '0px');
          document.documentElement.style.setProperty('--radius-lg', '0px');
        } else if (r === 'subtle') {
          document.documentElement.style.setProperty('--radius-sm', '4px');
          document.documentElement.style.setProperty('--radius-md', '6px');
          document.documentElement.style.setProperty('--radius-lg', '8px');
        } else if (r === 'smooth') {
          document.documentElement.style.setProperty('--radius-sm', '6px');
          document.documentElement.style.setProperty('--radius-md', '10px');
          document.documentElement.style.setProperty('--radius-lg', '16px');
        } else if (r === 'pill') {
          document.documentElement.style.setProperty('--radius-sm', '10px');
          document.documentElement.style.setProperty('--radius-md', '18px');
          document.documentElement.style.setProperty('--radius-lg', '24px');
        }
      };
    });
  }

  function applyBrandColor(hue, sat, lit) {
    document.documentElement.style.setProperty('--primary-hue', hue);
    document.documentElement.style.setProperty('--primary-sat', sat);
    document.documentElement.style.setProperty('--primary-lit', lit);
  }

  function applyHexColor(hex) {
    let c = hex.substring(1);
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const r = parseInt(c.substring(0, 2), 16) / 255;
    const g = parseInt(c.substring(2, 4), 16) / 255;
    const b = parseInt(c.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    applyBrandColor(Math.round(h * 360), Math.round(s * 100) + '%', Math.round(l * 100) + '%');
  }

  // =========================================================================
  // SECTION 18: EVENT BINDINGS & LIFECYCLE INITIALIZATION
  // =========================================================================

  /**
   * Master application bootstrapper.
   * Attaches event listeners, populates selects, and runs initial render passes.
   */
  function initApp() {
    renderHeader();
    renderUsersTable();
    renderGroupsGrid();
    renderHierarchy();
    renderRcsStudio();
    renderAuditLogs();
    setupFloatingTestingPanel();
    setupRebrandDrawer();

    // Tab switcher navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const targetId = btn.dataset.tab;
        const targetSection = document.getElementById(targetId);
        if (targetSection) targetSection.classList.add('active');
        activeTab = targetId;
      };
    });

    // Dark/Light Theme Toggle
    const themeToggle = document.getElementById('btnThemeToggle');
    const iconSun = document.getElementById('themeIconSun');
    const iconMoon = document.getElementById('themeIconMoon');
    if (themeToggle) {
      themeToggle.onclick = () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const nextTheme = isDark ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nextTheme);
        if (iconSun) iconSun.style.display = nextTheme === 'dark' ? 'block' : 'none';
        if (iconMoon) iconMoon.style.display = nextTheme === 'dark' ? 'none' : 'block';
      };
    }

    // Modal Close handlers
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.onclick = () => {
        const target = btn.dataset.close;
        const modal = document.getElementById(target);
        if (modal) modal.classList.remove('active');
      };
    });

    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.onclick = (e) => {
        if (e.target === modal) modal.classList.remove('active');
      };
    });

    // God Mode Triggers
    const btnGodHeader = document.getElementById('btnGodModeHeader');
    const btnGodTest = document.getElementById('btnGodModeTestPanel');
    if (btnGodHeader) btnGodHeader.onclick = activateGodMode;
    if (btnGodTest) btnGodTest.onclick = activateGodMode;

    // Persona Switcher Triggers
    const btnSwitchH = document.getElementById('btnOpenUserSwitcherHeader');
    const btnSwitchP = document.getElementById('btnSwitchPersonaTestPanel');
    if (btnSwitchH) btnSwitchH.onclick = openPersonaSwitcherModal;
    if (btnSwitchP) btnSwitchP.onclick = openPersonaSwitcherModal;

    // Live Mandatory Phone Auto-formatting
    const phoneInput = document.getElementById('userPhone');
    if (phoneInput) {
      phoneInput.oninput = (e) => {
        const formatted = formatPhoneNumber(e.target.value);
        e.target.value = formatted;
      };
    }

    // Search bar
    const searchInp = document.getElementById('userSearchInput');
    if (searchInp) {
      searchInp.oninput = (e) => {
        userFilterState.search = e.target.value;
        userPagination.page = 1;
        renderUsersTable();
      };
    }

    ['Country', 'Region', 'Org', 'SubOrg', 'Group', 'Status'].forEach(field => {
      const select = document.getElementById(`filter${field}`);
      if (select) {
        select.onchange = (e) => {
          userFilterState[field.charAt(0).toLowerCase() + field.slice(1) + (field === 'Country' || field === 'Status' ? '' : 'Id')] = e.target.value;
          userPagination.page = 1;
          renderUsersTable();
        };
      }
    });

    populateUserFilters();

    const btnResetFilters = document.getElementById('btnResetUserFilters');
    if (btnResetFilters) {
      btnResetFilters.onclick = () => {
        userFilterState = { search: '', country: 'ALL', regionId: 'ALL', orgId: 'ALL', subOrgId: 'ALL', groupId: 'ALL', status: 'ALL' };
        if (searchInp) searchInp.value = '';
        ['Country', 'Region', 'Org', 'SubOrg', 'Group', 'Status'].forEach(field => {
          const select = document.getElementById(`filter${field}`);
          if (select) select.value = 'ALL';
        });
        renderUsersTable();
      };
    }

    // Select All Checkbox
    const selectAllCheck = document.getElementById('checkSelectAllUsers');
    if (selectAllCheck) {
      selectAllCheck.onchange = (e) => {
        const filtered = getFilteredUsers();
        if (e.target.checked) {
          filtered.forEach(u => selectedUserIds.add(u.id));
        } else {
          selectedUserIds.clear();
        }
        renderUsersTable();
      };
    }

    // Event Delegation: User Table Actions
    const usersTable = document.getElementById('usersTable');
    if (usersTable) {
      usersTable.onclick = (e) => {
        const rowCheck = e.target.closest('.user-row-check');
        if (rowCheck) {
          const uid = rowCheck.dataset.id;
          if (rowCheck.checked) selectedUserIds.add(uid);
          else selectedUserIds.delete(uid);
          renderUsersTable();
          return;
        }

        const editBtn = e.target.closest('.btn-action-edit');
        if (editBtn) {
          const uid = editBtn.dataset.id;
          const user = DB.users.find(u => u.id === uid);
          if (user) openUserModal(user);
          return;
        }

        const pwdBtn = e.target.closest('.btn-action-pwd');
        if (pwdBtn) {
          const uid = pwdBtn.dataset.id;
          openPasswordModal(uid);
          return;
        }

        const statusBtn = e.target.closest('.btn-action-status');
        if (statusBtn) {
          const uid = statusBtn.dataset.id;
          const user = DB.users.find(u => u.id === uid);
          if (user) {
            user.status = user.status === 'active' ? 'suspended' : 'active';
            saveDB();
            renderUsersTable();
            showToast(`User ${user.name} status updated to ${user.status}.`, 'info');
          }
          return;
        }

        const deleteBtn = e.target.closest('.btn-action-delete');
        if (deleteBtn) {
          const uid = deleteBtn.dataset.id;
          const user = DB.users.find(u => u.id === uid);
          if (user && confirm(`Permanently remove user ${user.name}?`)) {
            DB.users = DB.users.filter(u => u.id !== uid);
            selectedUserIds.delete(uid);
            saveDB();
            renderUsersTable();
            showToast(`User ${user.name} removed.`, 'warning');
          }
          return;
        }
      };
    }

    // Pagination Click
    const pageControls = document.getElementById('usersPaginationControls');
    if (pageControls) {
      pageControls.onclick = (e) => {
        const pageBtn = e.target.closest('.page-btn');
        if (!pageBtn || pageBtn.disabled) return;

        if (pageBtn.id === 'btnPagePrev') {
          userPagination.page--;
        } else if (pageBtn.id === 'btnPageNext') {
          userPagination.page++;
        } else if (pageBtn.dataset.page) {
          userPagination.page = parseInt(pageBtn.dataset.page, 10);
        }
        renderUsersTable();
      };
    }

    const btnCreateUser = document.getElementById('btnOpenCreateUser');
    if (btnCreateUser) {
      btnCreateUser.onclick = () => {
        if (!hasPrivilege('create_user')) {
          showToast('Access Denied: Your group does not have the "Create Users" privilege.', 'danger');
          return;
        }
        openUserModal();
      };
    }

    const formUser = document.getElementById('formUser');
    if (formUser) formUser.onsubmit = handleSaveUser;

    const btnCreateGroup = document.getElementById('btnOpenCreateGroup');
    if (btnCreateGroup) {
      btnCreateGroup.onclick = () => {
        if (!hasPrivilege('create_group')) {
          showToast('Access Denied: Your group does not have "Create Groups" privilege.', 'danger');
          return;
        }
        openGroupModal();
      };
    }

    const formGroup = document.getElementById('formGroup');
    if (formGroup) formGroup.onsubmit = handleSaveGroup;

    // Auto-Suggest Group Name button
    const btnAutoSuggest = document.getElementById('btnAutoSuggestGroupName');
    if (btnAutoSuggest) {
      btnAutoSuggest.onclick = () => {
        const privs = getPrivilegesFromForm();
        const scope = {
          country: document.getElementById('groupScopeCountry').value
        };
        const suggestion = generateSmartGroupName(privs, scope);
        document.getElementById('groupNameInput').value = suggestion.name;
        document.getElementById('groupCodenameInput').value = suggestion.codename;
        showToast(`Auto-suggested codename: ${suggestion.codename}`, 'info');
      };
    }

    // Select All Privileges helper
    document.querySelectorAll('.select-all-btn').forEach(btn => {
      btn.onclick = () => {
        const target = btn.dataset.target;
        const container = document.getElementById(target);
        if (container) {
          const checks = container.querySelectorAll('.priv-check');
          const allChecked = Array.from(checks).every(c => c.checked);
          checks.forEach(c => c.checked = !allChecked);
          btn.textContent = allChecked ? 'Select All' : 'Deselect All';
        }
      };
    });

    // RCS Pills Selection
    document.addEventListener('click', (e) => {
      const pill = e.target.closest('.rcs-pill');
      if (pill) {
        pill.classList.toggle('selected');
      }
    });

    const rcsTrigChk = document.getElementById('rcsTriggerAllowedCheck');
    if (rcsTrigChk) {
      rcsTrigChk.onchange = () => {
        const block = document.getElementById('rcsTriggerOptionsBlock');
        if (block) block.style.display = rcsTrigChk.checked ? 'flex' : 'none';
      };
    }

    const rcsRecvChk = document.getElementById('rcsReceiveAllowedCheck');
    if (rcsRecvChk) {
      rcsRecvChk.onchange = () => {
        const block = document.getElementById('rcsReceiveOptionsBlock');
        if (block) block.style.display = rcsRecvChk.checked ? 'flex' : 'none';
      };
    }

    const rcsTrigAllR = document.getElementById('rcsTriggerAllRadio');
    const rcsTrigSomeR = document.getElementById('rcsTriggerSomeRadio');
    if (rcsTrigAllR && rcsTrigSomeR) {
      const updateList = () => {
        const list = document.getElementById('rcsTriggerTypesList');
        if (list) list.style.display = rcsTrigSomeR.checked ? 'flex' : 'none';
      };
      rcsTrigAllR.onchange = updateList;
      rcsTrigSomeR.onchange = updateList;
    }

    const rcsRecvAllR = document.getElementById('rcsReceiveAllRadio');
    const rcsRecvSomeR = document.getElementById('rcsReceiveSomeRadio');
    if (rcsRecvAllR && rcsRecvSomeR) {
      const updateList = () => {
        const list = document.getElementById('rcsReceiveTypesList');
        if (list) list.style.display = rcsRecvSomeR.checked ? 'flex' : 'none';
      };
      rcsRecvAllR.onchange = updateList;
      rcsRecvSomeR.onchange = updateList;
    }

    // Groups Grid Actions
    const groupsGrid = document.getElementById('groupsCardsGrid');
    if (groupsGrid) {
      groupsGrid.onclick = (e) => {
        const editBtn = e.target.closest('.btn-edit-group');
        if (editBtn) {
          const gid = editBtn.dataset.id;
          const grp = DB.groups.find(g => g.id === gid);
          if (grp) openGroupModal(grp);
          return;
        }

        const statusBtn = e.target.closest('.btn-toggle-group-status');
        if (statusBtn) {
          const gid = statusBtn.dataset.id;
          const grp = DB.groups.find(g => g.id === gid);
          if (grp) {
            grp.status = grp.status === 'active' ? 'disabled' : 'active';
            saveDB();
            renderGroupsGrid();
            showToast(`Group ${grp.name} is now ${grp.status}.`, 'info');
          }
          return;
        }

        const deleteBtn = e.target.closest('.btn-delete-group');
        if (deleteBtn) {
          const gid = deleteBtn.dataset.id;
          const grp = DB.groups.find(g => g.id === gid);
          if (grp && confirm(`Delete group ${grp.name}? Users assigned to it will be reassigned.`)) {
            DB.groups = DB.groups.filter(g => g.id !== gid);
            saveDB();
            renderGroupsGrid();
            showToast(`Group ${grp.name} removed.`, 'warning');
          }
          return;
        }
      };
    }

    // Import CSV Modal Triggers
    const btnOpenImport = document.getElementById('btnOpenImportUsers');
    if (btnOpenImport) {
      btnOpenImport.onclick = () => {
        if (!hasPrivilege('import_users')) {
          showToast('Access Denied: Your group does not have "Import Users" privilege.', 'danger');
          return;
        }
        openImportModal();
      };
    }

    const dropzone = document.getElementById('csvDropzone');
    const fileInput = document.getElementById('csvFileInput');
    if (dropzone && fileInput) {
      dropzone.onclick = () => fileInput.click();
      fileInput.onchange = (e) => {
        if (e.target.files.length > 0) handleCsvFile(e.target.files[0]);
      };

      dropzone.ondragover = (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      };
      dropzone.ondragleave = () => dropzone.classList.remove('dragover');
      dropzone.ondrop = (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) handleCsvFile(e.dataTransfer.files[0]);
      };
    }

    const btnCommitImport = document.getElementById('btnCommitImport');
    if (btnCommitImport) btnCommitImport.onclick = commitImportUsers;

    const btnSampleCsv = document.getElementById('btnDownloadSampleCsv');
    if (btnSampleCsv) btnSampleCsv.onclick = downloadSampleCsv;

    // Export Users to CSV
    const btnExportCsv = document.getElementById('btnExportUsersCsv');
    if (btnExportCsv) {
      btnExportCsv.onclick = () => {
        const users = getFilteredUsers();
        let csv = 'id,first_name,last_name,email,mandatory_phone,country,region,organization,group,status\n';
        users.forEach(u => {
          const reg = DB.regions.find(r => r.id === u.regionId)?.name || '';
          const org = DB.organizations.find(o => o.id === u.orgId)?.name || '';
          const grp = DB.groups.find(g => g.id === u.groupId)?.codeName || '';
          csv += `"${u.id}","${u.firstName}","${u.lastName}","${u.email}","${u.phone}","${u.country}","${reg}","${org}","${grp}","${u.status}"\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `aegis_users_export_${Date.now()}.csv`;
        link.click();
        showToast(`Exported ${users.length} users to CSV.`, 'success');
      };
    }

    // Bulk Actions Setup
    const btnBulkChangeGrp = document.getElementById('btnBulkChangeGroup');
    const btnBulkChangeStat = document.getElementById('btnBulkChangeStatus');
    const btnBulkDel = document.getElementById('btnBulkDelete');
    const btnBulkClr = document.getElementById('btnBulkClear');

    if (btnBulkClr) btnBulkClr.onclick = () => {
      selectedUserIds.clear();
      renderUsersTable();
    };

    if (btnBulkDel) {
      btnBulkDel.onclick = () => {
        const count = selectedUserIds.size;
        if (confirm(`Permanently delete ${count} selected users?`)) {
          DB.users = DB.users.filter(u => !selectedUserIds.has(u.id));
          selectedUserIds.clear();
          saveDB();
          renderUsersTable();
          showToast(`Deleted ${count} users.`, 'warning');
        }
      };
    }

    if (btnBulkChangeGrp || btnBulkChangeStat) {
      const openBulkModal = () => {
        const modal = document.getElementById('modalBulkEdit');
        const countSpan = document.getElementById('bulkModalCount');
        const grpSelect = document.getElementById('bulkUpdateGroup');
        const orgSelect = document.getElementById('bulkUpdateOrg');
        if (!modal) return;

        if (countSpan) countSpan.textContent = selectedUserIds.size;
        if (grpSelect) {
          grpSelect.innerHTML = '<option value="NO_CHANGE">— Keep Existing Groups —</option>' + DB.groups.map(g => `
            <option value="${g.id}">${g.name} (${g.codeName})</option>
          `).join('');
        }
        if (orgSelect) {
          orgSelect.innerHTML = '<option value="NO_CHANGE">— Keep Existing Organizations —</option>' + DB.organizations.map(o => `
            <option value="${o.id}">${o.name}</option>
          `).join('');
        }

        modal.classList.add('active');
      };

      if (btnBulkChangeGrp) btnBulkChangeGrp.onclick = openBulkModal;
      if (btnBulkChangeStat) btnBulkChangeStat.onclick = openBulkModal;
    }

    const btnApplyBulk = document.getElementById('btnApplyBulkEdit');
    if (btnApplyBulk) {
      btnApplyBulk.onclick = () => {
        const newGroup = document.getElementById('bulkUpdateGroup').value;
        const newStatus = document.getElementById('bulkUpdateStatus').value;
        const newOrg = document.getElementById('bulkUpdateOrg').value;

        let modified = 0;
        DB.users.forEach(u => {
          if (selectedUserIds.has(u.id)) {
            if (newGroup !== 'NO_CHANGE') u.groupId = newGroup;
            if (newStatus !== 'NO_CHANGE') u.status = newStatus;
            if (newOrg !== 'NO_CHANGE') u.orgId = newOrg;
            modified++;
          }
        });

        saveDB();
        selectedUserIds.clear();
        document.getElementById('modalBulkEdit').classList.remove('active');
        renderUsersTable();
        showToast(`Bulk updated ${modified} users.`, 'success');
      };
    }

    // Password Management Modes
    document.querySelectorAll('.pwd-tab-btn').forEach(btn => {
      btn.onclick = () => switchPwdMode(btn.dataset.pwdMode);
    });

    const customPwd = document.getElementById('customPwdInput');
    if (customPwd) {
      customPwd.oninput = (e) => evaluatePasswordStrength(e.target.value);
    }

    const btnRegen = document.getElementById('btnRegeneratePwd');
    if (btnRegen) btnRegen.onclick = generateCryptoPassword;

    const btnCopy = document.getElementById('btnCopyGeneratedPwd');
    if (btnCopy) {
      btnCopy.onclick = () => {
        const pwd = document.getElementById('generatedPwdInput').value;
        navigator.clipboard.writeText(pwd).then(() => {
          showToast('Generated password copied to clipboard!', 'info');
        });
      };
    }

    const btnSendOtp = document.getElementById('btnSendRecoveryOtp');
    if (btnSendOtp) {
      btnSendOtp.onclick = () => {
        const notice = document.getElementById('recoveryOtpSentNotice');
        if (notice) notice.style.display = 'block';
        showToast('RCS Recovery OTP simulated to user device.', 'success');
      };
    }

    const btnApplyPwd = document.getElementById('btnApplyPasswordChange');
    if (btnApplyPwd) {
      btnApplyPwd.onclick = () => {
        const targetId = document.getElementById('pwdTargetUserId').value;
        const user = DB.users.find(u => u.id === targetId);
        if (user) {
          showToast(`Password successfully updated for ${user.name}.`, 'success');
          addAuditLog('Password Change', `Password reset/change applied for ${user.name}`);
        }
        document.getElementById('modalPassword').classList.remove('active');
      };
    }

    // RCS Form Dispatch Handler
    const rcsForm = document.getElementById('rcsDispatchForm');
    if (rcsForm) {
      rcsForm.onsubmit = (e) => {
        e.preventDefault();
        const senderGid = document.getElementById('rcsSenderGroupSelect').value;
        const typeId = document.getElementById('rcsMessageTypeSelect').value;
        const title = document.getElementById('rcsMsgTitle').value;
        const targetChecks = Array.from(document.querySelectorAll('.rcs-target-check:checked')).map(c => c.value);

        if (targetChecks.length === 0) {
          showToast('Select at least one recipient group with RCS receive privilege!', 'warning');
          return;
        }

        const logEntry = {
          id: `rcs-${Date.now()}`,
          timestamp: new Date().toISOString(),
          senderGroupId: senderGid,
          typeId,
          title,
          recipientGroupIds: targetChecks,
          status: 'Dispatched & Delivered'
        };

        DB.rcsLogs.unshift(logEntry);
        saveDB();
        renderRcsStudio();
        showToast(`RCS broadcast "${title}" sent to ${targetChecks.length} groups!`, 'success');
        addAuditLog('RCS Dispatch', `Dispatched RCS message type ${typeId}`);
      };
    }

    ['rcsMsgTitle', 'rcsMsgBody', 'rcsActionBtnLabel'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.oninput = updateRcsPreview;
    });

    const btnClearAudit = document.getElementById('btnClearAuditLogs');
    if (btnClearAudit) {
      btnClearAudit.onclick = () => {
        DB.auditLogs = [];
        saveDB();
        renderAuditLogs();
        showToast('Audit log history cleared.', 'info');
      };
    }

    // Hierarchy Add Modal Triggers
    const btnAddReg = document.getElementById('btnAddRegionBtn');
    const btnAddOrg = document.getElementById('btnAddOrgBtn');
    const btnAddSub = document.getElementById('btnAddSubOrgBtn');

    if (btnAddReg) btnAddReg.onclick = () => openHierarchyModal('region');
    if (btnAddOrg) btnAddOrg.onclick = () => openHierarchyModal('org');
    if (btnAddSub) btnAddSub.onclick = () => openHierarchyModal('sub');

    // Random User Simulation Button
    const btnRand = document.getElementById('btnRandomUserTestPanel');
    if (btnRand) {
      btnRand.onclick = () => {
        const rand = DB.users[Math.floor(Math.random() * DB.users.length)];
        switchActiveUser(rand.id);
      };
    }
  }

  function populateUserFilters() {
    const regSelect = document.getElementById('filterRegion');
    const orgSelect = document.getElementById('filterOrg');
    const subSelect = document.getElementById('filterSubOrg');
    const grpSelect = document.getElementById('filterGroup');

    if (regSelect) {
      regSelect.innerHTML = '<option value="ALL">All Regions</option>' + DB.regions.map(r => `
        <option value="${r.id}">[${r.country}] ${r.name}</option>
      `).join('');
    }
    if (orgSelect) {
      orgSelect.innerHTML = '<option value="ALL">All Organizations</option>' + DB.organizations.map(o => `
        <option value="${o.id}">${o.name}</option>
      `).join('');
    }
    if (subSelect) {
      subSelect.innerHTML = '<option value="ALL">All Sub-organizations</option>' + DB.subOrganizations.map(s => `
        <option value="${s.id}">${s.name}</option>
      `).join('');
    }
    if (grpSelect) {
      grpSelect.innerHTML = '<option value="ALL">All Groups</option>' + DB.groups.map(g => `
        <option value="${g.id}">${g.name} (${g.codeName})</option>
      `).join('');
    }
  }

  /**
   * Opens the Persona Switcher modal dialog for testing purposes.
   */
  function openPersonaSwitcherModal() {
    const modal = document.getElementById('modalPersonaSwitcher');
    const grpFilter = document.getElementById('personaFilterGroup');
    const orgFilter = document.getElementById('personaFilterOrg');
    const countryFilter = document.getElementById('personaFilterCountry');
    const searchInput = document.getElementById('personaSearchInput');
    const tableBody = document.getElementById('personaListTableBody');

    if (!modal || !tableBody) return;

    if (grpFilter) {
      grpFilter.innerHTML = '<option value="ALL">All Groups</option>' + DB.groups.map(g => `
        <option value="${g.id}">${g.name} (${g.codeName})</option>
      `).join('');
    }
    if (orgFilter) {
      orgFilter.innerHTML = '<option value="ALL">All Organizations</option>' + DB.organizations.map(o => `
        <option value="${o.id}">${o.name}</option>
      `).join('');
    }

    function renderPersonaList() {
      const cVal = countryFilter ? countryFilter.value : 'ALL';
      const gVal = grpFilter ? grpFilter.value : 'ALL';
      const oVal = orgFilter ? orgFilter.value : 'ALL';
      const qVal = searchInput ? searchInput.value.toLowerCase() : '';

      const matched = DB.users.filter(u => {
        if (cVal !== 'ALL' && u.country !== cVal) return false;
        if (gVal !== 'ALL' && u.groupId !== gVal) return false;
        if (oVal !== 'ALL' && u.orgId !== oVal) return false;
        if (qVal && !u.name.toLowerCase().includes(qVal) && !u.email.toLowerCase().includes(qVal)) return false;
        return true;
      });

      tableBody.innerHTML = matched.slice(0, 50).map(u => {
        const grp = DB.groups.find(g => g.id === u.groupId);
        const org = DB.organizations.find(o => o.id === u.orgId);
        const isCurrent = u.id === currentUser.id;

        return `
          <tr>
            <td>
              <div style="font-weight: 600;">${u.name} ${isCurrent ? '<span class="badge badge-success">ACTIVE</span>' : ''}</div>
              <div style="font-size: 0.725rem; color: var(--text-muted);">${u.email} • ${u.phone}</div>
            </td>
            <td>
              <span class="badge badge-primary">${grp ? grp.codeName : 'N/A'}</span>
            </td>
            <td style="font-size: 0.775rem;">
              ${u.country === 'CZ' ? '🇨🇿' : '🇸🇰'} ${org ? org.name : '—'}
            </td>
            <td>
              <button class="btn btn-primary btn-sm btn-select-persona" data-id="${u.id}" ${isCurrent ? 'disabled' : ''}>
                ${isCurrent ? 'Current' : 'Simulate'}
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }

    if (countryFilter) countryFilter.onchange = renderPersonaList;
    if (grpFilter) grpFilter.onchange = renderPersonaList;
    if (orgFilter) orgFilter.onchange = renderPersonaList;
    if (searchInput) searchInput.oninput = renderPersonaList;

    tableBody.onclick = (e) => {
      const btn = e.target.closest('.btn-select-persona');
      if (btn) {
        switchActiveUser(btn.dataset.id);
        modal.classList.remove('active');
      }
    };

    const btnPickRand = document.getElementById('btnPickRandomFilteredUser');
    if (btnPickRand) {
      btnPickRand.onclick = () => {
        const rows = Array.from(tableBody.querySelectorAll('.btn-select-persona:not(:disabled)'));
        if (rows.length > 0) {
          const randBtn = rows[Math.floor(Math.random() * rows.length)];
          switchActiveUser(randBtn.dataset.id);
          modal.classList.remove('active');
        } else {
          showToast('No alternative users match the current filter criteria.', 'warning');
        }
      };
    }

    renderPersonaList();
    modal.classList.add('active');
  }

  /**
   * Opens the hierarchy modal to add or edit Region, Organization, or Sub-organization.
   * @param {'region'|'org'|'sub'} type - Level of hierarchy
   */
  function openHierarchyModal(type) {
    const modal = document.getElementById('modalHierarchy');
    const title = document.getElementById('hierarchyModalTitle');
    const levelInput = document.getElementById('hierarchyLevelType');
    const parentGroup = document.getElementById('hierarchyParentGroup');
    const parentLabel = document.getElementById('hierarchyParentLabel');
    const parentSelect = document.getElementById('hierarchyParentSelect');
    const nameInput = document.getElementById('hierarchyName');
    const codeInput = document.getElementById('hierarchyCode');

    if (!modal) return;

    levelInput.value = type;

    if (type === 'region') {
      title.textContent = 'Add Geographic Region';
      parentGroup.style.display = 'none';
    } else if (type === 'org') {
      title.textContent = 'Add Educational Organization';
      parentGroup.style.display = 'block';
      parentLabel.textContent = 'Parent Geographic Region';
      parentSelect.innerHTML = DB.regions.map(r => `
        <option value="${r.id}">[${r.country}] ${r.name}</option>
      `).join('');
    } else {
      title.textContent = 'Add Institutional Sub-organization';
      parentGroup.style.display = 'block';
      parentLabel.textContent = 'Parent Educational Organization';
      parentSelect.innerHTML = DB.organizations.map(o => `
        <option value="${o.id}">${o.name} (${o.code})</option>
      `).join('');
    }

    nameInput.value = '';
    codeInput.value = '';

    const form = document.getElementById('formHierarchy');
    form.onsubmit = (e) => {
      e.preventDefault();
      const name = nameInput.value.trim();
      const code = codeInput.value.trim().toUpperCase();

      if (type === 'region') {
        const newReg = {
          id: `reg-${Date.now().toString(36)}`,
          country: 'CZ',
          name,
          code,
          status: 'active'
        };
        DB.regions.push(newReg);
      } else if (type === 'org') {
        const newOrg = {
          id: `org-${Date.now().toString(36)}`,
          regionId: parentSelect.value,
          name,
          code,
          status: 'active',
          type: 'Institution'
        };
        DB.organizations.push(newOrg);
      } else {
        const newSub = {
          id: `sub-${Date.now().toString(36)}`,
          orgId: parentSelect.value,
          name,
          code,
          status: 'active'
        };
        DB.subOrganizations.push(newSub);
      }

      saveDB();
      modal.classList.remove('active');
      renderHierarchy();
      populateUserFilters();
      showToast(`${name} (${code}) added to hierarchy.`, 'success');
    };

    modal.classList.add('active');
  }

  // Self-boot on document ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
