import { useState, useEffect } from 'react';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../../api/client';
import { licenseApi } from '../../api/license';
import { useAuth } from '../../contexts/AuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { UpgradePrompt } from '../../components/UpgradePrompt';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { TemplateEditor } from '../../components/email/TemplateEditor';
import { TemplatePreview } from '../../components/email/TemplatePreview';
import { VariablesReference } from '../../components/email/VariablesReference';
import { Eye, RotateCcw, Save, Send } from 'lucide-react';
import { Spinner } from '../../components/ui/spinner';
import type { AppSettings, EmailTemplateType, EmailTemplate } from '@shared/types';

const getTemplateTypes = (): { value: EmailTemplateType; label: string; description: string }[] => [
  { value: 'newReport', label: i18next.t('emailTemplates.newReport'), description: i18next.t('emailTemplates.newReportDescription') },
  { value: 'statusChange', label: i18next.t('emailTemplates.statusChange'), description: i18next.t('emailTemplates.statusChangeDescription') },
  { value: 'priorityChange', label: i18next.t('emailTemplates.priorityChange'), description: i18next.t('emailTemplates.priorityChangeDescription') },
  { value: 'assignment', label: i18next.t('emailTemplates.assignment'), description: i18next.t('emailTemplates.assignmentDescription') },
  { value: 'invitation', label: i18next.t('emailTemplates.invitation'), description: i18next.t('emailTemplates.invitationDescription') },
  { value: 'reportDeleted', label: i18next.t('emailTemplates.reportDeleted'), description: i18next.t('emailTemplates.reportDeletedDescription') },
  { value: 'testEmail', label: i18next.t('emailTemplates.testEmailLabel'), description: i18next.t('emailTemplates.testEmailDescription') },
  { value: 'reporterConfirmation', label: i18next.t('emailTemplates.reporterConfirmation'), description: i18next.t('emailTemplates.reporterConfirmationDescription') },
  { value: 'reporterStatusChange', label: i18next.t('emailTemplates.reporterStatusChange'), description: i18next.t('emailTemplates.reporterStatusChangeDescription') },
  { value: 'reporterPriorityChange', label: i18next.t('emailTemplates.reporterPriorityChange'), description: i18next.t('emailTemplates.reporterPriorityChangeDescription') },
  { value: 'reporterMessage', label: i18next.t('emailTemplates.reporterMessage'), description: i18next.t('emailTemplates.reporterMessageDescription') },
];

const TEMPLATE_VARIABLES: Record<EmailTemplateType, string[]> = {
  newReport: [
    'app.name',
    'app.url',
    'project.name',
    'report.title',
    'report.description',
    'report.status',
    'report.statusFormatted',
    'report.priority',
    'report.priorityFormatted',
    'report.url',
    'report.pageUrl',
    'report.createdAt',
  ],
  statusChange: [
    'app.name',
    'app.url',
    'project.name',
    'report.title',
    'report.description',
    'report.url',
    'oldStatus',
    'oldStatusFormatted',
    'newStatus',
    'newStatusFormatted',
  ],
  priorityChange: [
    'app.name',
    'app.url',
    'project.name',
    'report.title',
    'report.description',
    'report.url',
    'oldPriority',
    'oldPriorityFormatted',
    'newPriority',
    'newPriorityFormatted',
  ],
  assignment: [
    'app.name',
    'app.url',
    'project.name',
    'report.title',
    'report.description',
    'report.url',
    'assignee.name',
    'assignee.email',
  ],
  invitation: ['app.name', 'inviter.name', 'invite.url', 'invite.expiresInDays'],
  reportDeleted: [
    'app.name',
    'app.url',
    'project.name',
    'report.title',
    'report.description',
    'report.status',
    'report.statusFormatted',
    'report.priority',
    'report.priorityFormatted',
  ],
  testEmail: ['app.name'],
  reporterConfirmation: [
    'app.name',
    'app.url',
    'project.name',
    'report.title',
    'report.description',
    'report.status',
    'report.statusFormatted',
    'report.priority',
    'report.priorityFormatted',
    'report.createdAt',
  ],
  reporterStatusChange: [
    'app.name',
    'app.url',
    'project.name',
    'report.title',
    'report.description',
    'oldStatus',
    'oldStatusFormatted',
    'newStatus',
    'newStatusFormatted',
    'reporterMessage',
    'reporterMessageDisplay',
  ],
  reporterPriorityChange: [
    'app.name',
    'app.url',
    'project.name',
    'report.title',
    'report.description',
    'oldPriority',
    'oldPriorityFormatted',
    'newPriority',
    'newPriorityFormatted',
  ],
  reporterMessage: [
    'app.name',
    'app.url',
    'project.name',
    'report.title',
    'report.status',
    'report.statusFormatted',
    'sender.name',
    'message',
  ],
};

export function EmailTemplatesSettings() {
  const { t } = useTranslation('emailTemplates');
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<EmailTemplateType>('newReport');
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<{ subject: string; html: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Check if custom-templates feature is licensed
  const { data: featureStatus, isLoading: isLoadingLicense } = useQuery({
    queryKey: ['license-features'],
    queryFn: licenseApi.getFeatures,
  });

  const isLicensed = featureStatus?.features?.['custom-templates'] ?? false;

  // Fetch current settings
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data.settings as AppSettings;
    },
  });

  // Fetch default template for reset
  const fetchDefaultTemplate = async (type: EmailTemplateType): Promise<EmailTemplate> => {
    const response = await api.get(`/settings/email-templates/defaults/${type}`);
    return response.data.template;
  };

  // Load template when type changes or settings load
  useEffect(() => {
    if (settings) {
      const customTemplate = settings.emailTemplates?.[selectedType];
      if (customTemplate) {
        setSubject(customTemplate.subject);
        setHtml(customTemplate.html);
      } else {
        // Load default template
        fetchDefaultTemplate(selectedType).then((template) => {
          setSubject(template.subject);
          setHtml(template.html);
        });
      }
      setHasChanges(false);
      setShowPreview(false);
      setPreviewData(null);
    }
  }, [settings, selectedType]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const currentTemplates = settings?.emailTemplates || {};
      const updatedTemplates = {
        ...currentTemplates,
        [selectedType]: { subject, html },
      };
      const response = await api.put('/settings', {
        emailTemplates: updatedTemplates,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success(t('emailTemplates.templateSaved'));
      setHasChanges(false);
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || t('emailTemplates.saveFailed'));
    },
  });

  // Preview mutation
  const previewMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/settings/email-templates/preview', {
        type: selectedType,
        subject,
        html,
      });
      return response.data.preview as { subject: string; html: string };
    },
    onSuccess: (data) => {
      setPreviewData(data);
      setShowPreview(true);
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || t('emailTemplates.previewFailed'));
    },
  });

  // Send test email mutation
  const sendTestMutation = useMutation({
    mutationFn: async () => {
      if (!user?.email) {
        throw new Error(t('smtp.userEmailNotFound'));
      }
      const response = await api.post('/settings/email-templates/send-test', {
        type: selectedType,
        subject,
        html,
        recipientEmail: user.email,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success(t('emailTemplates.testEmailSent', { email: user?.email }));
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || t('emailTemplates.testEmailFailed'));
    },
  });

  // Reset to default
  const handleReset = async () => {
    try {
      const defaultTemplate = await fetchDefaultTemplate(selectedType);
      setSubject(defaultTemplate.subject);
      setHtml(defaultTemplate.html);
      setHasChanges(true);
      setShowPreview(false);
      setPreviewData(null);
      toast.success(t('emailTemplates.templateReset'));
    } catch {
      toast.error(t('emailTemplates.templateResetFailed'));
    }
  };

  const handleSubjectChange = (value: string) => {
    setSubject(value);
    setHasChanges(true);
  };

  const handleHtmlChange = (value: string) => {
    setHtml(value);
    setHasChanges(true);
  };

  const isLoading = isLoadingLicense || isLoadingSettings;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <Spinner className="mx-auto text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!isLicensed) {
    return (
      <UpgradePrompt
        feature="custom-templates"
        title={t('emailTemplates.emailTemplates')}
        description={t('emailTemplates.upgradeDescription')}
      />
    );
  }

  const templateTypes = getTemplateTypes();
  const selectedTemplateInfo = templateTypes.find((tpl) => tpl.value === selectedType);
  const availableVariables = TEMPLATE_VARIABLES[selectedType];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('emailTemplates.emailTemplatesTitle')}</CardTitle>
        <CardDescription>
          {t('emailTemplates.emailTemplatesTitleDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template Selector */}
        <div className="flex flex-wrap gap-2">
          {templateTypes.map((template) => (
            <Button
              key={template.value}
              variant={selectedType === template.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType(template.value)}
            >
              {template.label}
            </Button>
          ))}
        </div>

        {selectedTemplateInfo && (
          <p className="text-sm text-muted-foreground">{selectedTemplateInfo.description}</p>
        )}

        {/* Subject Input */}
        <div className="space-y-2">
          <Label htmlFor="subject">{t('emailTemplates.subjectLine')}</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => handleSubjectChange(e.target.value)}
            placeholder={t('emailTemplates.subjectPlaceholder')}
          />
          <p className="text-xs text-muted-foreground">
            {t('emailTemplates.subjectVariableHint', { var: '{{app.name}}' })}
          </p>
        </div>

        {/* Variables Reference */}
        <VariablesReference variables={availableVariables} />

        {/* Template Editor */}
        <div className="space-y-2">
          <Label>{t('emailTemplates.emailBody')}</Label>
          <TemplateEditor
            value={html}
            onChange={handleHtmlChange}
            availableVariables={availableVariables}
            placeholder={t('emailTemplates.htmlContentPlaceholder')}
          />
        </div>

        {/* Preview Section */}
        {showPreview && previewData && (
          <div className="space-y-2">
            <Label>{t('emailTemplates.previewWithSampleData')}</Label>
            <TemplatePreview subject={previewData.subject} html={previewData.html} />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => {
              if (showPreview) {
                setShowPreview(false);
              } else {
                previewMutation.mutate();
              }
            }}
            disabled={previewMutation.isPending || !subject || !html}
          >
            {previewMutation.isPending ? (
              <>
                <Spinner size="sm" className="mr-2" />
                {t('emailTemplates.loadingDot')}
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? t('emailTemplates.hidePreview') : t('emailTemplates.previewBtn')}
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => sendTestMutation.mutate()}
            disabled={sendTestMutation.isPending || !subject || !html || !settings?.smtpEnabled}
            title={!settings?.smtpEnabled ? t('emailTemplates.smtpFirst') : undefined}
          >
            {sendTestMutation.isPending ? (
              <>
                <Spinner size="sm" className="mr-2" />
                {t('emailTemplates.sendingDot')}
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {t('emailTemplates.sendTestEmailBtn')}
              </>
            )}
          </Button>

          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('branding.resetToDefault')}
          </Button>

          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !hasChanges}
          >
            {saveMutation.isPending ? (
              <>
                <Spinner size="sm" className="mr-2" />
                {t('emailTemplates.savingDot')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {t('emailTemplates.saveTemplate')}
              </>
            )}
          </Button>
        </div>

        {user?.email && (
          <p className="text-xs text-muted-foreground">
            {t('emailTemplates.testEmailWillBeSent')} <strong>{user.email}</strong>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
