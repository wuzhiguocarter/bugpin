import { Github } from 'lucide-react';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import { Integration, IntegrationType, GitHubIntegrationConfig } from '@shared/types';
import { IntegrationDialog } from '../components/IntegrationDialog';

export interface IntegrationConfigDialogProps {
  open: boolean;
  onClose: () => void;
  integration?: Integration;
  projectId: string;
}

export interface IntegrationTypeDefinition {
  type: IntegrationType;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  maxPerProject: number;
  getConfigSummary: (integration: Integration) => React.ReactNode;
  ConfigDialog: React.ComponentType<IntegrationConfigDialogProps>;
}

function GitHubConfigSummary({ integration }: { integration: Integration }) {
  const { t } = useTranslation();
  const config = integration.config as GitHubIntegrationConfig;
  return (
    <div className="space-y-1 text-sm">
      <p className="text-muted-foreground">
        <span className="font-medium">{t('projectIntegrations.configRepository')}</span> {config.owner}/{config.repo}
      </p>
      <p className="text-muted-foreground">
        <span className="font-medium">{t('projectIntegrations.configToken')}</span> {config.accessToken}
      </p>
      {config.labels && config.labels.length > 0 && (
        <p className="text-muted-foreground">
          <span className="font-medium">{t('projectIntegrations.configLabels')}</span> {config.labels.join(', ')}
        </p>
      )}
    </div>
  );
}

export const CE_INTEGRATION_TYPES: IntegrationTypeDefinition[] = [
  {
    type: 'github',
    name: 'GitHub',
    get description() {
      return i18next.t('projectIntegrations.githubDescription');
    },
    icon: Github,
    maxPerProject: 1,
    getConfigSummary: (integration) => <GitHubConfigSummary integration={integration} />,
    ConfigDialog: IntegrationDialog,
  },
];
