import type { IconButtonProps } from '@mui/material';
import {
  Box,
  Divider,
  IconButton,
  Tooltip,
  Typography,
  styled,
  useTheme,
} from '@mui/material';
import {
  useCallback,
  type PropsWithChildren,
  useContext,
  useMemo,
} from 'react';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import ZoomInMapIcon from '@mui/icons-material/ZoomInMap';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';

import type {
  MenuItemData,
  EPI_ZONE,
} from '../../../models';
import {
  NestedDropdown,
  Spinner,
} from '../../ui';
import {
  EpiStoreContext,
  userProfileStore,
} from '../../../stores';
import { EpiWarning } from '../EpiWarning';
import {
  TestIdUtil,
  EpiDashboardUtil,
} from '../../../utils';

export interface WidgetHeaderIconButtonProps extends IconButtonProps {
  readonly label: string;
}

export const WidgetHeaderIconButton = ({ label, ...props }: WidgetHeaderIconButtonProps) => {
  const iconButtonElement = (
    <IconButton
      {...props}
      aria-label={label}
      color={'primary'}
      sx={{
        ...props.sx,
        '& svg': {
          fontSize: 18,
        },
      }}
    />
  );

  // Note: disabled buttons cannot have a tooltip
  if (props.disabled) {
    return iconButtonElement;
  }

  return (
    <Tooltip
      arrow
      placement={'bottom'}
      title={label}
    >
      {iconButtonElement}
    </Tooltip>
  );
};

export type WidgetProps = PropsWithChildren<{
  readonly title: string | MenuItemData;
  readonly primaryMenu?: MenuItemData[];
  readonly secondaryMenu?: MenuItemData[];
  readonly warningMessage?: string;
  readonly zone: EPI_ZONE;
  readonly expandDisabled?: boolean;
  readonly isLoading?: boolean;
}>;

const StyledDivider = styled(Divider)(({ theme }) => ({
  marginTop: theme.spacing(0.5),
  marginBottom: theme.spacing(0.5),
}));

export const EpiWidget = ({ title, children, primaryMenu, secondaryMenu, warningMessage, zone, expandDisabled, isLoading }: WidgetProps) => {
  const theme = useTheme();
  const [t] = useTranslation();

  const epiStore = useContext(EpiStoreContext);
  const expandZone = useStore(epiStore, (state) => state.expandZone);
  const expandedZone = useStore(epiStore, (state) => state.expandedZone);
  const enabledLayoutZoneCount = useStore(userProfileStore, (state) => EpiDashboardUtil.getEnabledZones(state.epiDashboardLayoutUserConfig).length);

  const isExpanded = expandedZone === zone;

  const onExpandButtonClick = useCallback(() => {
    expandZone(expandedZone === zone ? null : zone);
  }, [expandZone, expandedZone, zone]);

  const renderMenu = useCallback((menu: MenuItemData[]) => {
    return (
      <>
        {menu?.map(menuItemsData => {
          if (menuItemsData.items) {
            return (
              <NestedDropdown
                ButtonProps={{
                  variant: 'text',
                  size: 'small',
                  color: 'primary',
                  disabled: menuItemsData.disabled,
                }}
                MenuProps={{ elevation: 3 }}
                key={menuItemsData.label}
                menuItemsData={menuItemsData}
              />
            );
          }
          return (
            <WidgetHeaderIconButton
              disabled={menuItemsData.disabled}
              key={menuItemsData.label}
              label={menuItemsData.label}
              // eslint-disable-next-line react/jsx-no-bind
              onClick={() => menuItemsData.callback(null, null)}
              size={'small'}
            >
              {menuItemsData.leftIcon || menuItemsData.rightIcon}
            </WidgetHeaderIconButton>
          );
        })}
      </>
    );
  }, []);

  const titleElement = useMemo(() => (
    <Box
      sx={{
        height: theme.spacing(3),
        position: 'relative',
        width: '100%',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          height: theme.spacing(3),
          maxWidth: '100%',
          left: 0,
        }}
      >
        {typeof title === 'string' && (
          <Tooltip
            arrow
            placement={'right'}
            title={title}
          >
            <Typography
              component={'h2'}
              fontWeight={'bold'}
              sx={{
                display: 'inline-block',
                maxWidth: '100%',
                lineHeight: theme.spacing(3),
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
              }}
              variant={'body1'}
            >
              {title}
            </Typography>
          </Tooltip>
        )}
        {typeof title !== 'string' && (
          <NestedDropdown
            ButtonProps={{
              variant: 'text',
              size: 'small',
              color: 'inherit',
              sx: {
                margin: 0,
                padding: 0,
                background: 'none !important',
                '& span': {
                  margin: 0,
                },
                textTransform: 'none',
              },
            }}
            menuItemsData={title}
            showTopLevelTooltip
          />
        )}
      </Box>
    </Box>
  ), [theme, title]);

  return (
    <Box
      {...TestIdUtil.createAttributes('EpiWidget', { zone })}
      sx={{
        height: '100%',
      }}
    >

      {/* Widget header bar */}
      <Box sx={{
        height: theme.spacing(3),
        display: 'flex',
        justifyContent: 'space-between',
      }}
      >
        {/* Title */}
        {titleElement}

        <Box sx={{
          display: 'flex',
        }}
        >
          {/* secondary menu */}
          <Box
            sx={{
              justifySelf: 'right',
              display: 'flex',
              height: `calc(${theme.spacing(3)} - 1px)`,
              marginTop: '1px',
            }}
          >
            {primaryMenu?.length > 0 && renderMenu(primaryMenu)}
            {primaryMenu?.length > 0 && (
              <StyledDivider
                flexItem
                orientation={'vertical'}
                variant={'middle'}
              />
            )}
          </Box>

          {/* primary menu */}
          <Box
            sx={{
              justifySelf: 'right',
              display: 'flex',
              height: `calc(${theme.spacing(3)} - 1px)`,
              marginTop: '1px',
            }}
          >
            {secondaryMenu?.length > 0 && renderMenu(secondaryMenu)}
            {secondaryMenu?.length > 0 && (
              <StyledDivider
                flexItem
                orientation={'vertical'}
                variant={'middle'}
              />
            )}
            {enabledLayoutZoneCount > 1 && (
              <WidgetHeaderIconButton
                disabled={expandDisabled}
                label={isExpanded ? t`Collapse` : t`Expand`}
                onClick={onExpandButtonClick}
                sx={{
                  marginRight: theme.spacing(-1),
                }}
              >
                {isExpanded && (
                  <ZoomInMapIcon />
                )}
                {!isExpanded && (
                  <ZoomOutMapIcon />
                )}
              </WidgetHeaderIconButton>
            )}
          </Box>
        </Box>

      </Box>

      {/* Widget content */}
      <Box sx={{
        height: `calc(100% - ${theme.spacing(3)})`,
        position: 'relative',
      }}
      >
        {warningMessage && (
          <Box sx={{
            height: theme.spacing(3),
          }}
          >
            <EpiWarning warningMessage={warningMessage} />
          </Box>
        )}
        <Box sx={{
          height: warningMessage ? `calc(100% - ${theme.spacing(3)})` : '100%',
        }}
        >
          {isLoading && (
            <Spinner
              label={t`Loading`}
            />
          )}
          {!isLoading && children}
        </Box>
      </Box>
    </Box>
  );
};
