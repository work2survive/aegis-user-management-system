"""
Generate realistic Czech and Slovak dataset for User Management System:
- 300 Users with Czech & Slovak names, unified phone numbers (+420 / +421), email, role, group, status, region, org, sub-org.
- 20 Groups with diverse privileges, scope restrictions, codenames, and descriptions.
- Hierarchical Regions (Czech Republic & Slovakia), Organizations (Universities, Gymnasiums, Technical Colleges, Regional Offices), Sub-organizations (Faculties, Departments, Administrative Units).
- RCS Message Types (10 standard types).
"""

import json
import random

random.seed(42)

# Regions
REGIONS = [
    # Czech Republic
    {"id": "reg-cz-prg", "country": "CZ", "name": "Hlavní město Praha", "code": "PRG", "status": "active"},
    {"id": "reg-cz-jhm", "country": "CZ", "name": "Jihomoravský kraj", "code": "JHM", "status": "active"},
    {"id": "reg-cz-msk", "country": "CZ", "name": "Moravskoslezský kraj", "code": "MSK", "status": "active"},
    {"id": "reg-cz-stc", "country": "CZ", "name": "Středočeský kraj", "code": "STC", "status": "active"},
    {"id": "reg-cz-plk", "country": "CZ", "name": "Plzeňský kraj", "code": "PLK", "status": "active"},
    {"id": "reg-cz-ulk", "country": "CZ", "name": "Ústecký kraj", "code": "ULK", "status": "active"},
    {"id": "reg-cz-jhc", "country": "CZ", "name": "Jihočeský kraj", "code": "JHC", "status": "active"},
    {"id": "reg-cz-olk", "country": "CZ", "name": "Olomoucký kraj", "code": "OLK", "status": "active"},
    # Slovakia
    {"id": "reg-sk-ba", "country": "SK", "name": "Bratislavský kraj", "code": "BA", "status": "active"},
    {"id": "reg-sk-ke", "country": "SK", "name": "Košický kraj", "code": "KE", "status": "active"},
    {"id": "reg-sk-za", "country": "SK", "name": "Žilinský kraj", "code": "ZA", "status": "active"},
    {"id": "reg-sk-po", "country": "SK", "name": "Prešovský kraj", "code": "PO", "status": "active"},
    {"id": "reg-sk-bb", "country": "SK", "name": "Banskobystrický kraj", "code": "BB", "status": "active"},
    {"id": "reg-sk-tt", "country": "SK", "name": "Trnavský kraj", "code": "TT", "status": "active"},
    {"id": "reg-sk-nr", "country": "SK", "name": "Nitriansky kraj", "code": "NR", "status": "active"},
    {"id": "reg-sk-tn", "country": "SK", "name": "Trenčiansky kraj", "code": "TN", "status": "active"}
]

# Organizations
ORGANIZATIONS = [
    # Czech Orgs
    {"id": "org-cuni", "regionId": "reg-cz-prg", "name": "Univerzita Karlova", "code": "CUNI", "status": "active", "type": "University"},
    {"id": "org-cvut", "regionId": "reg-cz-prg", "name": "České vysoké učení technické v Praze", "code": "CVUT", "status": "active", "type": "Technical University"},
    {"id": "org-muni", "regionId": "reg-cz-jhm", "name": "Masarykova univerzita", "code": "MUNI", "status": "active", "type": "University"},
    {"id": "org-vut", "regionId": "reg-cz-jhm", "name": "Vysoké učení technické v Brně", "code": "VUT", "status": "active", "type": "Technical University"},
    {"id": "org-vsb", "regionId": "reg-cz-msk", "name": "VŠB – Technická univerzita Ostrava", "code": "VSB", "status": "active", "type": "Technical University"},
    {"id": "org-gjk", "regionId": "reg-cz-prg", "name": "Gymnázium Jana Keplera", "code": "GJK", "status": "active", "type": "Gymnasium"},
    {"id": "org-gjs", "regionId": "reg-cz-jhm", "name": "Gymnázium J. Nerudy a tř. Kpt. Jaroše", "code": "GJAS", "status": "active", "type": "Gymnasium"},
    {"id": "org-kraj-cz-prg", "regionId": "reg-cz-prg", "name": "Magistrát hl. města Prahy - Odbor školství", "code": "MHMP-EDU", "status": "active", "type": "Regional Authority"},
    # Slovak Orgs
    {"id": "org-uniba", "regionId": "reg-sk-ba", "name": "Univerzita Komenského v Bratislave", "code": "UNIBA", "status": "active", "type": "University"},
    {"id": "org-stu", "regionId": "reg-sk-ba", "name": "Slovenská technická univerzita v Bratislave", "code": "STUBA", "status": "active", "type": "Technical University"},
    {"id": "org-tuke", "regionId": "reg-sk-ke", "name": "Technická univerzita v Košiciach", "code": "TUKE", "status": "active", "type": "Technical University"},
    {"id": "org-uniza", "regionId": "reg-sk-za", "name": "Žilinská univerzita v Žiline", "code": "UNIZA", "status": "active", "type": "Technical University"},
    {"id": "org-gpost", "regionId": "reg-sk-ke", "name": "Gymnázium Poštová 9, Košice", "code": "GPOST", "status": "active", "type": "Gymnasium"},
    {"id": "org-gjh", "regionId": "reg-sk-ba", "name": "Gymnázium Juraja Hronca", "code": "GJH", "status": "active", "type": "Gymnasium"},
    {"id": "org-minedu-sk", "regionId": "reg-sk-ba", "name": "Ministerstvo školstva, výskumu a mládeže SR", "code": "MINEDU-SK", "status": "active", "type": "Ministry"}
]

# Sub-organizations
SUB_ORGANIZATIONS = [
    # CUNI
    {"id": "sub-cuni-mff", "orgId": "org-cuni", "name": "Matematicko-fyzikální fakulta", "code": "MFF", "status": "active"},
    {"id": "sub-cuni-ff", "orgId": "org-cuni", "name": "Filozofická fakulta", "code": "FF", "status": "active"},
    {"id": "sub-cuni-lf1", "orgId": "org-cuni", "name": "1. lékařská fakulta", "code": "1LF", "status": "active"},
    # CVUT
    {"id": "sub-cvut-fit", "orgId": "org-cvut", "name": "Fakulta informačních technologií", "code": "FIT", "status": "active"},
    {"id": "sub-cvut-fel", "orgId": "org-cvut", "name": "Fakulta elektrotechnická", "code": "FEL", "status": "active"},
    # MUNI
    {"id": "sub-muni-fi", "orgId": "org-muni", "name": "Fakulta informatiky", "code": "FI", "status": "active"},
    {"id": "sub-muni-ped", "orgId": "org-muni", "name": "Pedagogická fakulta", "code": "PED", "status": "active"},
    # VUT
    {"id": "sub-vut-fit", "orgId": "org-vut", "name": "Fakulta informačních technologií", "code": "VUT-FIT", "status": "active"},
    # VSB
    {"id": "sub-vsb-fei", "orgId": "org-vsb", "name": "Fakulta elektrotechniky a informatiky", "code": "FEI", "status": "active"},
    # GJK
    {"id": "sub-gjk-sec", "orgId": "org-gjk", "name": "Sekce přírodních věd", "code": "SPV", "status": "active"},
    {"id": "sub-gjk-hum", "orgId": "org-gjk", "name": "Sekce humanitních oborů", "code": "SHO", "status": "active"},
    # GJAS
    {"id": "sub-gjas-all", "orgId": "org-gjs", "name": "Všeobecná katedra", "code": "VK", "status": "active"},
    # MHMP
    {"id": "sub-mhmp-ins", "orgId": "org-kraj-cz-prg", "name": "Oddělení školské inspekce a auditů", "code": "INS", "status": "active"},
    # UNIBA
    {"id": "sub-uniba-fmph", "orgId": "org-uniba", "name": "Fakulta matematiky, fyziky a informatiky", "code": "FMFI", "status": "active"},
    {"id": "sub-uniba-pravo", "orgId": "org-uniba", "name": "Právnická fakulta", "code": "PRAVO", "status": "active"},
    # STUBA
    {"id": "sub-stu-fiit", "orgId": "org-stu", "name": "Fakulta informatiky a informačných technológií", "code": "FIIT", "status": "active"},
    {"id": "sub-stu-fei", "orgId": "org-stu", "name": "Fakulta elektrotechniky a informatiky", "code": "FEI-SK", "status": "active"},
    # TUKE
    {"id": "sub-tuke-fei", "orgId": "org-tuke", "name": "Fakulta elektrotechniky a informatiky TUKE", "code": "FEI-TUKE", "status": "active"},
    # UNIZA
    {"id": "sub-uniza-fri", "orgId": "org-uniza", "name": "Fakulta riadenia a informatiky", "code": "FRI", "status": "active"},
    # GPOST
    {"id": "sub-gpost-gym", "orgId": "org-gpost", "name": "Oddelenie bilingválneho štúdia", "code": "BIL", "status": "active"},
    # GJH
    {"id": "sub-gjh-ib", "orgId": "org-gjh", "name": "Medzinárodný program IB", "code": "IB", "status": "active"},
    # MINEDU-SK
    {"id": "sub-minedu-dig", "orgId": "org-minedu-sk", "name": "Sekcia digitálnej transformácie", "code": "DIGI", "status": "active"}
]

# RCS 10 Message Types
RCS_MESSAGE_TYPES = [
    {"id": "rcs-emergency", "name": "Emergency Alert", "description": "Critical alerts, evacuations, weather lockdowns", "category": "Critical"},
    {"id": "rcs-security-otp", "name": "Security & OTP Verification", "description": "Two-factor codes, password reset verifications", "category": "Security"},
    {"id": "rcs-sys-notice", "name": "System Notification", "description": "Maintenance, platform outages, account status changes", "category": "System"},
    {"id": "rcs-attendance", "name": "Attendance Reminder", "description": "Absence reporting, daily check-in alerts", "category": "Operations"},
    {"id": "rcs-grade-report", "name": "Grade & Report Update", "description": "Semester reports, exam marks, evaluations", "category": "Academic"},
    {"id": "rcs-calendar-notice", "name": "Schedule & Calendar Notice", "description": "Timetable changes, lecture cancellations", "category": "Academic"},
    {"id": "rcs-admin-memo", "name": "Administrative Memo", "description": "Official directives, staff protocols, regulatory filings", "category": "Administrative"},
    {"id": "rcs-billing-fee", "name": "Billing & Fee Notice", "description": "Tuition invoices, dorm payments, scholarship grants", "category": "Finance"},
    {"id": "rcs-event-invitation", "name": "Event Invitation", "description": "Open doors, graduation ceremonies, conferences", "category": "Events"},
    {"id": "rcs-general-broadcast", "name": "General Broadcast", "description": "School community newsletters and campus announcements", "category": "General"}
]

ALL_RCS_IDS = [m["id"] for m in RCS_MESSAGE_TYPES]

# 20 Distinct Groups with varied restrictions and privileges
# Privileges:
# group_mgmt: create_group, edit_group, delete_group, disable_group
# user_mgmt: create_user, edit_user, delete_user, disable_user, bulk_edit_users, import_users
# personal_info: view_others_personal, edit_others_personal, edit_own_personal, change_password, choose_or_generated_password, retrieve_forgotten_password
# hierarchy_mgmt: manage_regions, manage_organizations, manage_sub_organizations
# rcs_trigger: allow_all (bool), types (list of ids)
# rcs_receive: allow_all (bool), types (list of ids)

GROUPS = [
    {
        "id": "grp-super-admin",
        "name": "Super Administrators (God Mode)",
        "codeName": "NEXUS-OMNI",
        "description": "Full access to all regions, organizations, user and group privileges with zero restrictions.",
        "category": "Super Users",
        "status": "active",
        "scope": {"country": "ALL", "regionId": "ALL", "orgId": "ALL", "subOrgId": "ALL"},
        "privileges": {
            "group_mgmt": ["create_group", "edit_group", "delete_group", "disable_group"],
            "user_mgmt": ["create_user", "edit_user", "delete_user", "disable_user", "bulk_edit_users", "import_users"],
            "personal_info": ["view_others_personal", "edit_others_personal", "edit_own_personal", "change_password", "choose_or_generated_password", "retrieve_forgotten_password"],
            "hierarchy_mgmt": ["manage_regions", "manage_organizations", "manage_sub_organizations"],
            "rcs_trigger": {"allowed": True, "allow_all": True, "types": ALL_RCS_IDS},
            "rcs_receive": {"allowed": True, "allow_all": True, "types": ALL_RCS_IDS}
        }
    },
    {
        "id": "grp-supervisor-l3",
        "name": "National Education Supervisors (Level 3)",
        "codeName": "AURA-GOV",
        "description": "National oversight authority for ministry inspections across Czech Republic and Slovakia.",
        "category": "Supervisors of different levels",
        "status": "active",
        "scope": {"country": "ALL", "regionId": "ALL", "orgId": "ALL", "subOrgId": "ALL"},
        "privileges": {
            "group_mgmt": ["edit_group", "disable_group"],
            "user_mgmt": ["create_user", "edit_user", "disable_user", "bulk_edit_users", "import_users"],
            "personal_info": ["view_others_personal", "edit_own_personal", "change_password", "choose_or_generated_password", "retrieve_forgotten_password"],
            "hierarchy_mgmt": ["manage_organizations", "manage_sub_organizations"],
            "rcs_trigger": {"allowed": True, "allow_all": False, "types": ["rcs-emergency", "rcs-sys-notice", "rcs-admin-memo", "rcs-general-broadcast"]},
            "rcs_receive": {"allowed": True, "allow_all": True, "types": ALL_RCS_IDS}
        }
    },
    {
        "id": "grp-supervisor-cz-reg",
        "name": "Czech Regional Education Supervisors (Level 2)",
        "codeName": "BOHEMIA-INSP",
        "description": "Supervises school districts and academic compliance within Czech Republic territories.",
        "category": "Supervisors of different levels",
        "status": "active",
        "scope": {"country": "CZ", "regionId": "ALL", "orgId": "ALL", "subOrgId": "ALL"},
        "privileges": {
            "group_mgmt": ["edit_group"],
            "user_mgmt": ["create_user", "edit_user", "disable_user", "bulk_edit_users"],
            "personal_info": ["view_others_personal", "edit_own_personal", "change_password", "choose_or_generated_password", "retrieve_forgotten_password"],
            "hierarchy_mgmt": ["manage_sub_organizations"],
            "rcs_trigger": {"allowed": True, "allow_all": False, "types": ["rcs-emergency", "rcs-admin-memo", "rcs-attendance"]},
            "rcs_receive": {"allowed": True, "allow_all": False, "types": ["rcs-emergency", "rcs-admin-memo", "rcs-sys-notice"]}
        }
    },
    {
        "id": "grp-supervisor-sk-reg",
        "name": "Slovak Regional Education Supervisors (Level 2)",
        "codeName": "TATRA-INSP",
        "description": "Supervises school districts and educational institutions strictly within Slovakia.",
        "category": "Supervisors of different levels",
        "status": "active",
        "scope": {"country": "SK", "regionId": "ALL", "orgId": "ALL", "subOrgId": "ALL"},
        "privileges": {
            "group_mgmt": ["edit_group"],
            "user_mgmt": ["create_user", "edit_user", "disable_user", "bulk_edit_users"],
            "personal_info": ["view_others_personal", "edit_own_personal", "change_password", "choose_or_generated_password", "retrieve_forgotten_password"],
            "hierarchy_mgmt": ["manage_sub_organizations"],
            "rcs_trigger": {"allowed": True, "allow_all": False, "types": ["rcs-emergency", "rcs-admin-memo", "rcs-attendance"]},
            "rcs_receive": {"allowed": True, "allow_all": False, "types": ["rcs-emergency", "rcs-admin-memo", "rcs-sys-notice"]}
        }
    },
    {
        "id": "grp-supervisor-l1-district",
        "name": "District Academic Supervisors (Level 1)",
        "codeName": "VANGUARD-L1",
        "description": "District-tier evaluators focused on Prague and Bratislava metropolitan zones.",
        "category": "Supervisors of different levels",
        "status": "active",
        "scope": {"country": "CZ", "regionId": "reg-cz-prg", "orgId": "ALL", "subOrgId": "ALL"},
        "privileges": {
            "group_mgmt": [],
            "user_mgmt": ["create_user", "edit_user"],
            "personal_info": ["view_others_personal", "edit_own_personal", "change_password", "choose_or_generated_password", "retrieve_forgotten_password"],
            "hierarchy_mgmt": [],
            "rcs_trigger": {"allowed": True, "allow_all": False, "types": ["rcs-attendance", "rcs-calendar-notice"]},
            "rcs_receive": {"allowed": True, "allow_all": False, "types": ["rcs-emergency", "rcs-sys-notice", "rcs-admin-memo"]}
        }
    },
    {
        "id": "grp-school-principals",
        "name": "School Principals & Directors",
        "codeName": "RECTOR-EXEC",
        "description": "Full school administration privileges within their designated organization.",
        "category": "Schools",
        "status": "active",
        "scope": {"country": "ALL", "regionId": "ALL", "orgId": "ALL", "subOrgId": "ALL"},
        "privileges": {
            "group_mgmt": ["create_group", "edit_group", "disable_group"],
            "user_mgmt": ["create_user", "edit_user", "disable_user", "bulk_edit_users", "import_users"],
            "personal_info": ["view_others_personal", "edit_others_personal", "edit_own_personal", "change_password", "choose_or_generated_password", "retrieve_forgotten_password"],
            "hierarchy_mgmt": ["manage_sub_organizations"],
            "rcs_trigger": {"allowed": True, "allow_all": False, "types": ["rcs-emergency", "rcs-sys-notice", "rcs-attendance", "rcs-grade-report", "rcs-calendar-notice", "rcs-admin-memo", "rcs-event-invitation", "rcs-general-broadcast"]},
            "rcs_receive": {"allowed": True, "allow_all": True, "types": ALL_RCS_IDS}
        }
    },
    {
        "id": "grp-teachers-senior",
        "name": "Senior Academic Faculty & Head Teachers",
        "codeName": "FACULTY-SR",
        "description": "Senior instructors managing student curricula, bulk grading and class messaging.",
        "category": "Teachers",
        "status": "active",
        "scope": {"country": "ALL", "regionId": "ALL", "orgId": "ALL", "subOrgId": "ALL"},
        "privileges": {
            "group_mgmt": [],
            "user_mgmt": ["edit_user"],
            "personal_info": ["view_others_personal", "edit_own_personal", "change_password", "choose_or_generated_password", "retrieve_forgotten_password"],
            "hierarchy_mgmt": [],
            "rcs_trigger": {"allowed": True, "allow_all": False, "types": ["rcs-attendance", "rcs-grade-report", "rcs-calendar-notice", "rcs-event-invitation"]},
            "rcs_receive": {"allowed": True, "allow_all": False, "types": ["rcs-emergency", "rcs-sys-notice", "rcs-admin-memo", "rcs-attendance", "rcs-calendar-notice"]}
        }
    },
    {
        "id": "grp-teachers-standard",
        "name": "Certified Teachers & Instructors",
        "codeName": "PEDAGOG-STD",
        "description": "Classroom educators with access to student records and grade alerts.",
        "category": "Teachers",
        "status": "active",
        "scope": {"country": "ALL", "regionId": "ALL", "orgId": "ALL", "subOrgId": "ALL"},
        "privileges": {
            "group_mgmt": [],
            "user_mgmt": [],
            "personal_info": ["view_others_personal", "edit_own_personal", "change_password", "choose_or_generated_password", "retrieve_forgotten_password"],
            "hierarchy_mgmt": [],
            "rcs_trigger": {"allowed": True, "allow_all": False, "types": ["rcs-attendance", "rcs-grade-report"]},
            "rcs_receive": {"allowed": True, "allow_all": False, "types": ["rcs-emergency", "rcs-calendar-notice", "rcs-general-broadcast", "rcs-admin-memo"]}
        }
    },
    {
        "id": "grp-teachers-prg-cuni",
        "name": "Charles University Faculty Lecturers",
        "codeName": "CUNI-DOCENT",
        "description": "Faculty lecturers restricted strictly to Charles University departments in Prague.",
        "category": "Teachers",
        "status": "active",
        "scope": {"country": "CZ", "regionId": "reg-cz-prg", "orgId": "org-cuni", "subOrgId": "ALL"},
        "privileges": {
            "group_mgmt": [],
            "user_mgmt": ["edit_user"],
            "personal_info": ["view_others_personal", "edit_own_personal", "change_password", "choose_or_generated_password", "retrieve_forgotten_password"],
            "hierarchy_mgmt": [],
            "rcs_trigger": {"allowed": True, "allow_all": False, "types": ["rcs-calendar-notice", "rcs-grade-report", "rcs-event-invitation"]},
            "rcs_receive": {"allowed": True, "allow_all": False, "types": ["rcs-emergency", "rcs-sys-notice", "rcs-calendar-notice"]}
        }
    },
    {
        "id": "grp-teachers-sk-stu",
        "name": "STU Bratislava Technical Lecturers",
        "codeName": "STU-DOCENT",
        "description": "Teaching personnel restricted strictly to STU faculties in Bratislava.",
        "category": "Teachers",
        "status": "active",
        "scope": {"country": "SK", "regionId": "reg-sk-ba", "orgId": "org-stu", "subOrgId": "ALL"},
        "privileges": {
            "group_mgmt": [],
            "user_mgmt": ["edit_user"],
            "personal_info": ["view_others_personal", "edit_own_personal", "change_password", "choose_or_generated_password", "retrieve_forgotten_password"],
            "hierarchy_mgmt": [],
            "rcs_trigger": {"allowed": True, "allow_all": False, "types": ["rcs-calendar-notice", "rcs-grade-report"]},
            "rcs_receive": {"allowed": True, "allow_all": False, "types": ["rcs-emergency", "rcs-sys-notice", "rcs-calendar-notice"]}
        }
    },
    {
        "id": "grp-alumni-presidents",
        "name": "Alumni Chapter Presidents & Officers",
        "codeName": "ALUMNI-CHAIR",
        "description": "Organizers coordinating graduate networking, fundraising, and alumni gatherings.",
        "category": "Alumni",
        "status": "active",
        "scope": {"country": "ALL", "regionId": "ALL", "orgId": "ALL", "subOrgId": "ALL"},
        "privileges": {
            "group_mgmt": [],
            "user_mgmt": [],
            "personal_info": ["view_others_personal", "edit_own_personal", "change_password", "choose_or_generated_password", "retrieve_forgotten_password"],
            "hierarchy_mgmt": [],
            "rcs_trigger": {"allowed": True, "allow_all": False, "types": ["rcs-event-invitation", "rcs-general-broadcast", "rcs-billing-fee"]},
            "rcs_receive": {"allowed": True, "allow_all": False, "types": ["rcs-event-invitation", "rcs-general-broadcast"]}
        }
    },
    {
        "id": "grp-alumni-members",
        "name": "Registered Alumni Network",
        "codeName": "ALUMNI-VERIFIED",
        "description": "Graduated students maintaining alumni profile and communications.",
        "category": "Alumni",
        "status": "active",
        "scope": {"country": "ALL", "regionId": "ALL", "orgId": "ALL", "subOrgId": "ALL"},
        "privileges": {
            "group_mgmt": [],
            "user_mgmt": [],
            "personal_info": ["edit_own_personal", "change_password", "choose_or_generated_password", "retrieve_forgotten_password"],
            "hierarchy_mgmt": [],
            "rcs_trigger": {"allowed": False, "allow_all": False, "types": []},
            "rcs_receive": {"allowed": True, "allow_all": False, "types": ["rcs-event-invitation", "rcs-general-broadcast"]}
        }
    },
    {
        "id": "grp-testers-qa-lead",
        "name": "QA Simulation Test Leads",
        "codeName": "TESTER-ALPHA",
        "description": "Testing supervisors simulating cross-organization role transitions and privileges.",
        "category": "Testers",
        "status": "active",
        "scope": {"country": "ALL", "regionId": "ALL", "orgId": "ALL", "subOrgId": "ALL"},
        "privileges": {
            "group_mgmt": ["create_group", "edit_group", "disable_group"],
            "user_mgmt": ["create_user", "edit_user", "disable_user", "bulk_edit_users", "import_users"],
            "personal_info": ["view_others_personal", "edit_others_personal", "edit_own_personal", "change_password", "choose_or_generated_password", "retrieve_forgotten_password"],
            "hierarchy_mgmt": [],
            "rcs_trigger": {"allowed": True, "allow_all": True, "types": ALL_RCS_IDS},
            "rcs_receive": {"allowed": True, "allow_all": True, "types": ALL_RCS_IDS}
        }
    },
    {
        "id": "grp-testers-automation",
        "name": "Automated Sandbox Testers",
        "codeName": "TESTER-SANDBOX",
        "description": "Restricted QA accounts used for automated UI test suites and regression testing.",
        "category": "Testers",
        "status": "active",
        "scope": {"country": "CZ", "regionId": "reg-cz-prg", "orgId": "org-cvut", "subOrgId": "sub-cvut-fit"},
        "privileges": {
            "group_mgmt": [],
            "user_mgmt": ["create_user", "edit_user", "delete_user"],
            "personal_info": ["view_others_personal", "edit_own_personal", "change_password", "choose_or_generated_password", "retrieve_forgotten_password"],
            "hierarchy_mgmt": [],
            "rcs_trigger": {"allowed": True, "allow_all": False, "types": ["rcs-sys-notice", "rcs-security-otp"]},
            "rcs_receive": {"allowed": True, "allow_all": False, "types": ["rcs-sys-notice", "rcs-security-otp"]}
        }
    },
    {
        "id": "grp-it-admins-regional",
        "name": "Regional IT Operations Administrators",
        "codeName": "SYSADMIN-CORP",
        "description": "System operators managing identity provisioning, import workflows and credential resets.",
        "category": "Super Users",
        "status": "active",
        "scope": {"country": "ALL", "regionId": "ALL", "orgId": "ALL", "subOrgId": "ALL"},
        "privileges": {
            "group_mgmt": ["create_group", "edit_group"],
            "user_mgmt": ["create_user", "edit_user", "delete_user", "disable_user", "bulk_edit_users", "import_users"],
            "personal_info": ["view_others_personal", "edit_others_personal", "edit_own_personal", "change_password", "choose_or_generated_password", "retrieve_forgotten_password"],
            "hierarchy_mgmt": ["manage_organizations", "manage_sub_organizations"],
            "rcs_trigger": {"allowed": True, "allow_all": False, "types": ["rcs-security-otp", "rcs-sys-notice", "rcs-emergency"]},
            "rcs_receive": {"allowed": True, "allow_all": True, "types": ALL_RCS_IDS}
        }
    },
    {
        "id": "grp-admissions-officers",
        "name": "Admissions & Registrar Officers",
        "codeName": "REGISTRAR-OFFICE",
        "description": "Staff in charge of prospective student batch imports and enrollment records.",
        "category": "Schools",
        "status": "active",
        "scope": {"country": "ALL", "regionId": "ALL", "orgId": "ALL", "subOrgId": "ALL"},
        "privileges": {
            "group_mgmt": [],
            "user_mgmt": ["create_user", "edit_user", "bulk_edit_users", "import_users"],
            "personal_info": ["view_others_personal", "edit_own_personal", "change_password", "choose_or_generated_password", "retrieve_forgotten_password"],
            "hierarchy_mgmt": [],
            "rcs_trigger": {"allowed": True, "allow_all": False, "types": ["rcs-event-invitation", "rcs-billing-fee", "rcs-general-broadcast"]},
            "rcs_receive": {"allowed": True, "allow_all": False, "types": ["rcs-admin-memo", "rcs-billing-fee"]}
        }
    },
    {
        "id": "grp-student-council",
        "name": "Student Council Representatives",
        "codeName": "STUDENT-SENATE",
        "description": "Elected student leaders permitted to send community and event announcements.",
        "category": "Schools",
        "status": "active",
        "scope": {"country": "ALL", "regionId": "ALL", "orgId": "ALL", "subOrgId": "ALL"},
        "privileges": {
            "group_mgmt": [],
            "user_mgmt": [],
            "personal_info": ["edit_own_personal", "change_password", "choose_or_generated_password", "retrieve_forgotten_password"],
            "hierarchy_mgmt": [],
            "rcs_trigger": {"allowed": True, "allow_all": False, "types": ["rcs-event-invitation", "rcs-general-broadcast"]},
            "rcs_receive": {"allowed": True, "allow_all": False, "types": ["rcs-emergency", "rcs-event-invitation", "rcs-general-broadcast", "rcs-calendar-notice"]}
        }
    },
    {
        "id": "grp-financial-accountants",
        "name": "Bursars & Tuition Finance Staff",
        "codeName": "FIN-BURSAR",
        "description": "Financial clerks issuing tuition statements, grant notices and payment reminders.",
        "category": "Schools",
        "status": "active",
        "scope": {"country": "ALL", "regionId": "ALL", "orgId": "ALL", "subOrgId": "ALL"},
        "privileges": {
            "group_mgmt": [],
            "user_mgmt": ["edit_user"],
            "personal_info": ["view_others_personal", "edit_own_personal", "change_password", "choose_or_generated_password", "retrieve_forgotten_password"],
            "hierarchy_mgmt": [],
            "rcs_trigger": {"allowed": True, "allow_all": False, "types": ["rcs-billing-fee", "rcs-admin-memo"]},
            "rcs_receive": {"allowed": True, "allow_all": False, "types": ["rcs-billing-fee", "rcs-emergency", "rcs-sys-notice"]}
        }
    },
    {
        "id": "grp-gymnasium-staff-ke",
        "name": "Košice Gymnasium Staff & Tutors",
        "codeName": "KOSICE-GYM-FACULTY",
        "description": "Secondary school educators restricted strictly to Košice Poštová Gymnasium.",
        "category": "Schools",
        "status": "active",
        "scope": {"country": "SK", "regionId": "reg-sk-ke", "orgId": "org-gpost", "subOrgId": "ALL"},
        "privileges": {
            "group_mgmt": [],
            "user_mgmt": ["edit_user"],
            "personal_info": ["view_others_personal", "edit_own_personal", "change_password", "choose_or_generated_password", "retrieve_forgotten_password"],
            "hierarchy_mgmt": [],
            "rcs_trigger": {"allowed": True, "allow_all": False, "types": ["rcs-attendance", "rcs-grade-report", "rcs-calendar-notice"]},
            "rcs_receive": {"allowed": True, "allow_all": False, "types": ["rcs-emergency", "rcs-calendar-notice", "rcs-general-broadcast"]}
        }
    },
    {
        "id": "grp-security-dispatchers",
        "name": "Campus Safety & Emergency Dispatchers",
        "codeName": "DISPATCH-CENTRAL",
        "description": "Security coordinators with high-priority RCS emergency broadcasting privileges.",
        "category": "Super Users",
        "status": "active",
        "scope": {"country": "ALL", "regionId": "ALL", "orgId": "ALL", "subOrgId": "ALL"},
        "privileges": {
            "group_mgmt": [],
            "user_mgmt": [],
            "personal_info": ["view_others_personal", "edit_own_personal", "change_password", "choose_or_generated_password", "retrieve_forgotten_password"],
            "hierarchy_mgmt": [],
            "rcs_trigger": {"allowed": True, "allow_all": False, "types": ["rcs-emergency", "rcs-security-otp", "rcs-sys-notice"]},
            "rcs_receive": {"allowed": True, "allow_all": True, "types": ALL_RCS_IDS}
        }
    }
]

# Real Czech and Slovak first & last names
CZ_MALE_FIRST = ["Jan", "Petr", "Tomáš", "Jakub", "Martin", "Michal", "Lukáš", "David", "Ondřej", "Jiří", "Filip", "Pavel", "Vojtěch", "Marek", "Matěj", "Adam", "Daniel", "Václav", "Karel", "Roman"]
CZ_FEMALE_FIRST = ["Eliška", "Tereza", "Anna", "Adéla", "Karolína", "Natálie", "Kristýna", "Lucie", "Kateřina", "Barbora", "Veronika", "Klára", "Markéta", "Michaela", "Jana", "Marie", "Lenka", "Hana", "Alena", "Zuzana"]
CZ_MALE_LAST = ["Novák", "Svoboda", "Novotný", "Dvořák", "Černý", "Procházka", "Kučera", "Veselý", "Horák", "Němec", "Marek", "Pospíšil", "Pokorný", "Hájek", "Jelínek", "Král", "Růžička", "Beneš", "Fiala", "Sedláček"]
CZ_FEMALE_LAST = ["Nováková", "Svobodová", "Novotná", "Dvořáková", "Černá", "Procházková", "Kučerová", "Veselá", "Horáková", "Němcová", "Marková", "Pospíšilová", "Pokorná", "Hájková", "Jelínková", "Králová", "Růžičková", "Benešová", "Fialová", "Sedláčková"]

SK_MALE_FIRST = ["Peter", "Martin", "Michal", "Tomáš", "Ján", "Marek", "Jakub", "Lukáš", "Patrik", "Matej", "Richard", "Filip", "Juraj", "Andrej", "Samuel", "Pavol", "Miroslav", "Branislav", "Vladimír", "Róbert"]
SK_FEMALE_FIRST = ["Zuzana", "Katarína", "Lucia", "Mária", "Martina", "Veronika", "Michaela", "Simona", "Kristína", "Monika", "Lenka", "Barbora", "Alexandra", "Dominika", "Patrícia", "Eva", "Jana", "Daniela", "Silvia", "Tatiana"]
SK_MALE_LAST = ["Kováč", "Varga", "Tóth", "Nagy", "Baláž", "Szabó", "Molnár", "Lukáč", "Kučera", "Polák", "Kollár", "Hudák", "Urban", "Novák", "Sopko", "Oravec", "Krajčík", "Petráš", "Bielik", "Rusnák"]
SK_FEMALE_LAST = ["Kováčová", "Vargová", "Tóthová", "Nagyová", "Balážová", "Szabóová", "Molnárová", "Lukáčová", "Kučerová", "Poláková", "Kollárová", "Hudáková", "Urbanová", "Nováková", "Sopková", "Oravcová", "Krajčíková", "Petrášová", "Bieliková", "Rusnáková"]

TITLES_BEFORE = ["Mgr.", "Ing.", "Bc.", "RNDr.", "MUDr.", "PhDr.", "doc. RNDr.", "prof. Ing.", ""]
TITLES_AFTER = ["Ph.D.", "CSc.", "MBA", ""]

# Generate phone number with strictly unified format: +420 XXX XXX XXX or +421 XXX XXX XXX
def generate_phone(country):
    if country == "CZ":
        prefix = "+420"
        area = random.choice(["601", "602", "603", "604", "605", "606", "607", "608", "720", "721", "724", "731", "737", "774", "775", "776", "777"])
    else:
        prefix = "+421"
        area = random.choice(["901", "902", "903", "904", "905", "907", "908", "910", "911", "915", "944", "948", "950"])
    p1 = f"{random.randint(100, 999)}"
    p2 = f"{random.randint(100, 999)}"
    return f"{prefix} {area} {p1[1:]} {p2}"

# Helper to normalize string for email
def slugify(text):
    trans = str.maketrans("áčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽäôľĺŕÄÔĽĹŔ", "acdeeinorstuuyzACDEEINORSTUUYZaollrAOLLR")
    clean = text.translate(trans).lower()
    return "".join(c for c in clean if c.isalnum() or c in ".-_")

# Map org to sub-orgs
ORG_SUB_MAP = {}
for sub in SUB_ORGANIZATIONS:
    ORG_SUB_MAP.setdefault(sub["orgId"], []).append(sub["id"])

# Map region to orgs
REG_ORG_MAP = {}
for org in ORGANIZATIONS:
    REG_ORG_MAP.setdefault(org["regionId"], []).append(org["id"])

# Map country to regions
CZ_REGIONS = [r["id"] for r in REGIONS if r["country"] == "CZ"]
SK_REGIONS = [r["id"] for r in REGIONS if r["country"] == "SK"]

CZ_ORGS = [o["id"] for o in ORGANIZATIONS if o["regionId"].startswith("reg-cz")]
SK_ORGS = [o["id"] for o in ORGANIZATIONS if o["regionId"].startswith("reg-sk")]

GROUP_WEIGHTS = {
    "grp-super-admin": 4,
    "grp-supervisor-l3": 8,
    "grp-supervisor-cz-reg": 12,
    "grp-supervisor-sk-reg": 12,
    "grp-supervisor-l1-district": 14,
    "grp-school-principals": 18,
    "grp-teachers-senior": 32,
    "grp-teachers-standard": 65,
    "grp-teachers-prg-cuni": 16,
    "grp-teachers-sk-stu": 16,
    "grp-alumni-presidents": 8,
    "grp-alumni-members": 40,
    "grp-testers-qa-lead": 5,
    "grp-testers-automation": 4,
    "grp-it-admins-regional": 9,
    "grp-admissions-officers": 11,
    "grp-student-council": 16,
    "grp-financial-accountants": 10,
    "grp-gymnasium-staff-ke": 6,
    "grp-security-dispatchers": 6
}

# Generate 300 Users
users = []
user_idx = 1

# First user: Super User (Jan Novák)
# Second user: Slovak Super Admin (Peter Kováč)
# Third user: Prague Principal (Mgr. Eliška Procházková)
# Fourth user: Slovak Teacher (doc. RNDr. Martin Horváth)
# Fifth user: QA Tester (Ing. Jakub Dvořák)

group_pool = []
for gid, w in GROUP_WEIGHTS.items():
    group_pool.extend([gid] * w)

while len(group_pool) < 300:
    group_pool.append(random.choice(list(GROUP_WEIGHTS.keys())))
random.shuffle(group_pool)
group_pool = group_pool[:300]

# Ensure first user is super admin
group_pool[0] = "grp-super-admin"
group_pool[1] = "grp-super-admin"
group_pool[2] = "grp-supervisor-l3"
group_pool[3] = "grp-school-principals"
group_pool[4] = "grp-testers-qa-lead"

for i in range(300):
    gid = group_pool[i]
    target_grp = next(g for g in GROUPS if g["id"] == gid)

    # Determine country based on group scope or balanced
    if target_grp["scope"]["country"] == "CZ":
        country = "CZ"
    elif target_grp["scope"]["country"] == "SK":
        country = "SK"
    else:
        country = "CZ" if (i % 2 == 0) else "SK"

    # Region
    if target_grp["scope"]["regionId"] != "ALL":
        reg_id = target_grp["scope"]["regionId"]
    else:
        reg_id = random.choice(CZ_REGIONS if country == "CZ" else SK_REGIONS)

    # Org
    if target_grp["scope"]["orgId"] != "ALL":
        org_id = target_grp["scope"]["orgId"]
    else:
        avail_orgs = REG_ORG_MAP.get(reg_id, [])
        if not avail_orgs:
            avail_orgs = CZ_ORGS if country == "CZ" else SK_ORGS
        org_id = random.choice(avail_orgs)

    # SubOrg
    if target_grp["scope"]["subOrgId"] != "ALL":
        sub_org_id = target_grp["scope"]["subOrgId"]
    else:
        avail_subs = ORG_SUB_MAP.get(org_id, [])
        sub_org_id = random.choice(avail_subs) if avail_subs else ""

    gender = "M" if random.random() > 0.48 else "F"
    if country == "CZ":
        first = random.choice(CZ_MALE_FIRST if gender == "M" else CZ_FEMALE_FIRST)
        last = random.choice(CZ_MALE_LAST if gender == "M" else CZ_FEMALE_LAST)
        domain = random.choice(["educz.org", "skola.cz", "muni.cz", "cuni.cz", "edu-portal.cz"])
    else:
        first = random.choice(SK_MALE_FIRST if gender == "M" else SK_FEMALE_FIRST)
        last = random.choice(SK_MALE_LAST if gender == "M" else SK_FEMALE_LAST)
        domain = random.choice(["edusk.sk", "uniba.sk", "stuba.sk", "skolstvo.sk", "gympost.sk"])

    title_b = random.choice(TITLES_BEFORE)
    title_a = random.choice(TITLES_AFTER) if random.random() > 0.7 else ""
    full_display_name = f"{title_b + ' ' if title_b else ''}{first} {last}{', ' + title_a if title_a else ''}".strip()

    username = f"{slugify(first)}.{slugify(last)}{random.randint(10, 99) if i > 50 else ''}"
    email = f"{slugify(first)}.{slugify(last)}@{domain}"
    phone = generate_phone(country)

    status_weights = ["active", "active", "active", "active", "inactive", "suspended"]
    user_status = "active" if i < 15 else random.choice(status_weights)

    dob_year = random.randint(1965, 2004)
    dob_month = random.randint(1, 12)
    dob_day = random.randint(1, 28)
    dob = f"{dob_year:04d}-{dob_month:02d}-{dob_day:02d}"

    street_cz = ["Národní", "Václavské nám.", "Kounicova", "Česká", "Masarykova", "Husova", "Komenského", "Sokolská", "Školní", "Lipová"]
    street_sk = ["Obchodná", "Štúrova", "Hlavná", "Dunajská", "Košická", "Mlynská", "Karpatská", "Bratislavská", "SNP", "Hviezdoslavova"]
    street = random.choice(street_cz if country == "CZ" else street_sk)
    house_num = random.randint(1, 140)
    city_cz = ["Praha", "Brno", "Ostrava", "Plzeň", "Olomouc", "Liberec", "České Budějovice"]
    city_sk = ["Bratislava", "Košice", "Žilina", "Prešov", "Banská Bystrica", "Trnava", "Nitra"]
    city = random.choice(city_cz if country == "CZ" else city_sk)
    zip_code = f"{random.randint(100, 999)} {random.randint(10, 99)}"

    users.append({
        "id": f"usr-{i+1:03d}",
        "username": username,
        "name": full_display_name,
        "firstName": first,
        "lastName": last,
        "email": email,
        "phone": phone,
        "country": country,
        "regionId": reg_id,
        "orgId": org_id,
        "subOrgId": sub_org_id,
        "groupId": gid,
        "status": user_status,
        "personalInfo": {
            "dateOfBirth": dob,
            "address": f"{street} {house_num}, {zip_code} {city}",
            "nationalId": f"{random.randint(60, 99)}{random.randint(1, 12):02d}{random.randint(1, 28):02d}/{random.randint(1000, 9999)}",
            "emergencyContact": f"{generate_phone(country)} ({random.choice(['Spouse', 'Parent', 'Sibling'])})",
            "bio": f"Authorized personnel in {first} {last}'s department. Registered under unified national identity guidelines."
        },
        "passwordHash": f"argon2id$v=19$m=65536,t=3,p=4${random.randint(10000000, 99999999)}",
        "createdAt": f"2025-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}T09:30:00Z",
        "lastLogin": f"2026-11-{random.randint(1, 6):02d}T{random.randint(8, 18):02d}:{random.randint(10, 59):02d}:00Z"
    })

# Output as JS data file
js_content = f"""// Simulated Database for User Management System
// Contains 300 Slovak & Czech users, 20 Groups, Hierarchical Regions, Organizations & Sub-Organizations

const INITIAL_REGIONS = {json.dumps(REGIONS, indent=2, ensure_ascii=False)};

const INITIAL_ORGANIZATIONS = {json.dumps(ORGANIZATIONS, indent=2, ensure_ascii=False)};

const INITIAL_SUB_ORGANIZATIONS = {json.dumps(SUB_ORGANIZATIONS, indent=2, ensure_ascii=False)};

const RCS_MESSAGE_TYPES = {json.dumps(RCS_MESSAGE_TYPES, indent=2, ensure_ascii=False)};

const INITIAL_GROUPS = {json.dumps(GROUPS, indent=2, ensure_ascii=False)};

const INITIAL_USERS = {json.dumps(users, indent=2, ensure_ascii=False)};

// Export for browser
if (typeof window !== 'undefined') {{
  window.DB_INITIAL = {{
    regions: INITIAL_REGIONS,
    organizations: INITIAL_ORGANIZATIONS,
    subOrganizations: INITIAL_SUB_ORGANIZATIONS,
    rcsMessageTypes: RCS_MESSAGE_TYPES,
    groups: INITIAL_GROUPS,
    users: INITIAL_USERS
  }};
}}
"""

with open("/home/antigravity/work2survive/UI-for-user-management/data.js", "w", encoding="utf-8") as f:
    f.write(js_content)

print(f"Successfully generated data.js with {len(users)} users, {len(GROUPS)} groups, {len(REGIONS)} regions, {len(ORGANIZATIONS)} orgs, and {len(SUB_ORGANIZATIONS)} sub-orgs.")
