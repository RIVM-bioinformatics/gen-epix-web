/* eslint-disable @typescript-eslint/naming-convention */
import {
  RouterErrorPage,
  OrganizationsAdminPage,
  CaseTypesAdminPage,
  CaseTypeSetsAdminPage,
  EtiologicalAgentsAdminPage,
  EtiologiesAdminPage,
  CaseSetStatusAdminPage,
  CaseTypeSetCategoriesAdminPage,
  DiseasesAdminPage,
  UserInvitationsAdminPage,
  OrganizationAdminPoliciesAdminPage,
  DimsAdminPage,
  ColsAdminPage,
  CaseTypeColsAdminPage,
  CaseTypeColSetsAdminPage,
  OutagesAdminPage,
  RegionsAdminPage,
  RegionSetsAdminPage,
  RegionSetShapesAdminPage,
  DataCollectionVisualizationPage,
  DataCollectionsAdminPage,
  DataCollectionSetsAdminPage,
  OrganizationAccessCasePoliciesAdminPage,
  UserAccessCasePoliciesAdminPage,
  OrganizationShareCasePoliciesAdminPage,
  UserShareCasePoliciesAdminPage,
} from '../pages';
import { ADMIN_PAGE_CATEGORY } from '../models';
import { UsersAdminPage } from '../pages/UsersAdminPage';
import type { MyNonIndexRouteObject } from '../models';
import {
  CommandName,
  PermissionType,
} from '../api';

export const adminRoutes: MyNonIndexRouteObject[] = [
  // USERS_AND_ORGANIZATIONS

  {
    path: '/management/organizations',
    Component: OrganizationsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      titleKey: 'Organizations',
      subTitleKey: 'Manage your organizations',
      requiredPermissions: [
        { command_name: CommandName.OrganizationCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.USERS_AND_ORGANIZATIONS,
    },
  },
  {
    path: '/management/users',
    Component: UsersAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      titleKey: 'Users',
      subTitleKey: 'Manage users',
      requiredPermissions: [
        { command_name: CommandName.UserCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.OrganizationCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.USERS_AND_ORGANIZATIONS,
    },
  },
  {
    path: '/management/user-invitations',
    Component: UserInvitationsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      titleKey: 'User invitations',
      subTitleKey: 'Invite users to your organization',
      requiredPermissions: [
        { command_name: CommandName.UserInvitationCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.OrganizationCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.USERS_AND_ORGANIZATIONS,
    },
  },
  {
    path: '/management/organization-admin-policies',
    Component: OrganizationAdminPoliciesAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      titleKey: 'Organization admin policies',
      subTitleKey: 'Manage organization admin policies',
      requiredPermissions: [
        { command_name: CommandName.OrganizationAdminPolicyCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.UserCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.OrganizationCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.USERS_AND_ORGANIZATIONS,
    },
  },

  // ACCESS_RIGHTS

  {
    path: '/management/data-collections',
    Component: DataCollectionsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      titleKey: 'Data collections',
      subTitleKey: 'Manage data collections',
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.ACCESS_RIGHTS,
      requiredPermissions: [
        { command_name: CommandName.DataCollectionCrudCommand, permission_type: PermissionType.READ },
      ],
    },
  },
  {
    path: '/management/data-collection-sets',
    Component: DataCollectionSetsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      titleKey: 'Data collection sets',
      subTitleKey: 'Manage data collection sets',
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.ACCESS_RIGHTS,
      requiredPermissions: [
        { command_name: CommandName.DataCollectionSetCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.DataCollectionCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.DataCollectionSetMemberCrudCommand, permission_type: PermissionType.READ },
      ],
    },
  },
  {
    path: '/management/case-type-col-sets',
    Component: CaseTypeColSetsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      titleKey: 'Case type column sets',
      subTitleKey: 'Manage case type column sets',
      requiredPermissions: [
        { command_name: CommandName.CaseTypeColSetCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.CaseTypeColSetMemberCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.CaseTypeColCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.ColCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.ACCESS_RIGHTS,
    },
  },
  {
    path: '/management/organization-access-case-policies',
    Component: OrganizationAccessCasePoliciesAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      titleKey: 'Organization access case policies',
      subTitleKey: 'Manage organization access case policies',
      requiredPermissions: [
        { command_name: CommandName.OrganizationAccessCasePolicyCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.OrganizationCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.DataCollectionCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.CaseTypeColSetCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.CaseTypeSetCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.ACCESS_RIGHTS,
    },
  },
  {
    path: '/management/organization-share-case-policies',
    Component: OrganizationShareCasePoliciesAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      titleKey: 'Organization share case policies',
      subTitleKey: 'Manage organization share case policies',
      requiredPermissions: [
        { command_name: CommandName.OrganizationShareCasePolicyCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.OrganizationCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.DataCollectionCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.ACCESS_RIGHTS,
    },
  },
  {
    path: '/management/user-access-case-policies',
    Component: UserAccessCasePoliciesAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      titleKey: 'User access case policies',
      subTitleKey: 'Manage user access case policies',
      requiredPermissions: [
        { command_name: CommandName.UserAccessCasePolicyCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.UserCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.DataCollectionCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.CaseTypeColSetCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.CaseTypeSetCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.ACCESS_RIGHTS,
    },
  },
  {
    path: '/management/user-share-case-policies',
    Component: UserShareCasePoliciesAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      titleKey: 'User share case policies',
      subTitleKey: 'Manage user share case policies',
      requiredPermissions: [
        { command_name: CommandName.UserAccessCasePolicyCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.UserCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.DataCollectionCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.CaseTypeSetCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.ACCESS_RIGHTS,
    },
  },


  // REFERENCE_DATA
  {
    path: '/management/dims',
    Component: DimsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      titleKey: 'Dimensions',
      subTitleKey: 'Manage dimensions',
      requiredPermissions: [
        { command_name: CommandName.DimCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
    },
  },
  {
    path: '/management/cols',
    Component: ColsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      titleKey: 'Columns',
      subTitleKey: 'Manage columns',
      requiredPermissions: [
        { command_name: CommandName.ColCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.DimCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.ConceptSetCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.RegionSetCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.GeneticDistanceProtocolCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
    },
  },
  {
    path: '/management/diseases',
    Component: DiseasesAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      titleKey: 'Diseases',
      subTitleKey: 'Manage diseases',
      requiredPermissions: [
        { command_name: CommandName.DiseaseCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
    },
  },
  {
    path: '/management/etiological-agents',
    Component: EtiologicalAgentsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      titleKey: 'Etiological agents',
      subTitleKey: 'Manage etiological agents',
      requiredPermissions: [
        { command_name: CommandName.EtiologicalAgentCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
    },
  },
  {
    path: '/management/etiologies',
    Component: EtiologiesAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      titleKey: 'Etiologies',
      subTitleKey: 'Manage etiologies',
      requiredPermissions: [
        { command_name: CommandName.EtiologyCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.DiseaseCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.EtiologicalAgentCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
    },
  },
  {
    path: '/management/case-set-statuses',
    Component: CaseSetStatusAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      titleKey: 'Case set statuses',
      subTitleKey: 'Manage case set statuses',
      requiredPermissions: [
        { command_name: CommandName.CaseSetStatusCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
    },
  },
  {
    path: '/management/case-types',
    Component: CaseTypesAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      titleKey: 'Case types',
      subTitleKey: 'Manage case types',
      requiredPermissions: [
        { command_name: CommandName.CaseTypeCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.DiseaseCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.EtiologicalAgentCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
    },
  },
  {
    path: '/management/case-type-cols',
    Component: CaseTypeColsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      titleKey: 'Case type columns',
      subTitleKey: 'Manage case type columns',
      requiredPermissions: [
        { command_name: CommandName.CaseTypeColCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.ColCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.TreeAlgorithmCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.CaseTypeCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
    },
  },
  {
    path: '/management/case-type-sets',
    Component: CaseTypeSetsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      titleKey: 'Case types sets',
      subTitleKey: 'Manage case types sets',
      requiredPermissions: [
        { command_name: CommandName.CaseTypeSetMemberCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.CaseTypeSetCategoryCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.CaseTypeSetCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.CaseTypeCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
    },
  },
  {
    path: '/management/case-type-set-categories',
    Component: CaseTypeSetCategoriesAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      titleKey: 'Case types set categories',
      subTitleKey: 'Manage case types set categories',
      requiredPermissions: [
        { command_name: CommandName.CaseTypeSetCategoryCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
    },
  },
  {
    path: '/management/regions',
    Component: RegionsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      titleKey: 'Regions',
      subTitleKey: 'Manage regions',
      requiredPermissions: [
        { command_name: CommandName.RegionCrudCommand, permission_type: PermissionType.READ },
        { command_name: CommandName.RegionSetCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
    },
  },
  {
    path: '/management/region-sets',
    Component: RegionSetsAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      titleKey: 'Region sets',
      subTitleKey: 'Manage region sets',
      requiredPermissions: [
        { command_name: CommandName.RegionSetCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
    },
  },
  {
    path: '/management/region-set-shapes',
    Component: RegionSetShapesAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      titleKey: 'Region set shapes',
      subTitleKey: 'Manage region set shapes',
      requiredPermissions: [
        { command_name: CommandName.RegionSetShapeCrudCommand, permission_type: PermissionType.READ },
      ],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
    },
  },
  // SYSTEM

  {
    path: '/management/outages',

    Component: OutagesAdminPage,
    errorElement: <RouterErrorPage />,
    handle: {
      titleKey: 'Outages',
      subTitleKey: 'Manage outages',
      requiredPermissions: [],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.SYSTEM,
    },
  },

  // HELPERS

  {
    path: '/management/data-collection-visualization-page',
    Component: DataCollectionVisualizationPage,
    errorElement: <RouterErrorPage />,
    handle: {
      titleKey: 'Data collection visualization',
      subTitleKey: 'View data collection visualization',
      requiredPermissions: [],
      requiresUserProfile: true,
      category: ADMIN_PAGE_CATEGORY.HELPERS,
    },
  },
];
