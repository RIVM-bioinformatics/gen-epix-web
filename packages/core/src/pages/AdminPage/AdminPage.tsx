import { useTranslation } from 'react-i18next';
import {
  Outlet,
  useLocation,
} from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
  CardHeader,
  CardActionArea,
  Divider,
} from '@mui/material';
import {
  useCallback,
  useMemo,
} from 'react';

import { PageContainer } from '../../components';
import { adminRoutes } from '../../app';
import { ADMIN_PAGE_CATEGORY } from '../../models';
import type { MyNonIndexRouteObject } from '../../models';
import {
  AuthorizationManager,
  RouterManager,
} from '../../classes';
import { TestIdUtil } from '../../utils';

type Category = {
  name: string;
  label: string;
  items: MyNonIndexRouteObject[];
};

export const AdminContent = () => {
  const location = useLocation();
  const [t] = useTranslation();
  const theme = useTheme();
  const authorizationManager = useMemo(() => AuthorizationManager.instance, []);

  const menuItems = useMemo(() => {
    const items = adminRoutes.filter(r => {
      const hasPermission = authorizationManager.doesUserHavePermission(r.handle.requiredPermissions);
      return !r.handle?.hidden && !r.index && hasPermission;
    });
    return items;
  }, [authorizationManager]);

  const categoryToLabelMap = useMemo<Record<ADMIN_PAGE_CATEGORY, string>>(() => {
    return {
      [ADMIN_PAGE_CATEGORY.ACCESS_RIGHTS]: t`Access rights`,
      [ADMIN_PAGE_CATEGORY.REFERENCE_DATA]: t`Reference data`,
      [ADMIN_PAGE_CATEGORY.SYSTEM]: t`System`,
      [ADMIN_PAGE_CATEGORY.USERS_AND_ORGANIZATIONS]: t`Users and organizations`,
      [ADMIN_PAGE_CATEGORY.HELPERS]: t`Helpers`,
    };
  }, [t]);


  const categories = useMemo<Category[]>(() => {
    return [
      ADMIN_PAGE_CATEGORY.USERS_AND_ORGANIZATIONS,
      ADMIN_PAGE_CATEGORY.ACCESS_RIGHTS,
      ADMIN_PAGE_CATEGORY.SYSTEM,
      ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      ADMIN_PAGE_CATEGORY.HELPERS,
    ].map(category => {
      return {
        name: category,
        label: categoryToLabelMap[category],
        items: menuItems.filter(r => r.handle.category as ADMIN_PAGE_CATEGORY === category),
      };
    }).filter(c => c.items.length);
  }, [categoryToLabelMap, menuItems]);

  const onCardClick = useCallback(async (path: string) => {
    await RouterManager.instance.router.navigate(path);
  }, []);

  if (location?.pathname !== '/management') {
    return (
      <Outlet />
    );
  }
  return (
    <Box>
      {categories.map(category => (
        <Box
          key={category.name}
          sx={{
            marginTop: 1,
            marginBottom: 3,
          }}
        >
          <Typography
            component={'h2'}
            sx={{
              marginBottom: 1,
            }}
            variant={'h3'}
          >
            {category.label}
          </Typography>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(1, 1fr)',
            gap: theme.spacing(1),
            [theme.breakpoints.up('md')]: {
              gridTemplateColumns: 'repeat(2, 1fr)',
            },
            [theme.breakpoints.up('lg')]: {
              gridTemplateColumns: 'repeat(3, 1fr)',
            },
            [theme.breakpoints.up('xl')]: {
              gridTemplateColumns: 'repeat(4, 1fr)',
            },
          }}
          >
            {category.items.map(item => (
              <Card
                key={item.path}
                square
                sx={{
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <CardActionArea
                // eslint-disable-next-line react/jsx-no-bind
                  onClick={async () => onCardClick(item.path)}
                >
                  <CardHeader title={t(item.handle.titleKey)} />
                  <CardContent>
                    <Typography
                      color={'text.primary'}
                      sx={{ mb: 1.5 }}
                    >
                      {t(item.handle.subTitleKey)}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Box>
          <Divider
            sx={{
              marginTop: 2,
              marginBottom: 2,
            }}
          />
        </Box>
      ))}


    </Box>
  );
};

export const AdminPage = () => {
  const [t] = useTranslation();

  return (
    <PageContainer
      showBreadcrumbs
      testIdAttributes={TestIdUtil.createAttributes('AdminPage')}
      title={t`Management`}
    >
      <AdminContent />
    </PageContainer>
  );
};
