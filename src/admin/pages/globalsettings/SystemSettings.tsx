import { useEffect } from 'react';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { api } from '../../api/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Spinner } from '../../components/ui/spinner';
import { Switch } from '../../components/ui/switch';
import type { AppSettings } from '@shared/types';

const systemSettingsSchema = z.object({
  appName: z.string().min(1, i18next.t('system.applicationNameRequired')),
  appUrl: z.string().url(i18next.t('system.invalidUrl')).or(z.literal('')),
  retentionDays: z.number().min(0, 'Must be 0 or more').max(3650, 'Must be 3650 or less'),
  updateCheckEnabled: z.boolean(),
});

type SystemSettingsFormData = z.infer<typeof systemSettingsSchema>;

export function SystemSettings() {
  return <SystemSettingsSection />;
}

function SystemSettingsSection() {
  const { t } = useTranslation('system');
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<SystemSettingsFormData>({
    resolver: zodResolver(systemSettingsSchema),
    defaultValues: {
      appName: '',
      appUrl: '',
      retentionDays: 90,
      updateCheckEnabled: true,
    },
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data.settings as AppSettings;
    },
  });

  useEffect(() => {
    if (settings) {
      reset({
        appName: settings.appName || '',
        appUrl: settings.appUrl || '',
        retentionDays: settings.retentionDays ?? 90,
        updateCheckEnabled: settings.updateCheckEnabled ?? true,
      });
    }
  }, [settings, reset]);

  const mutation = useMutation({
    mutationFn: async (data: Partial<AppSettings>) => {
      const response = await api.put('/settings', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['version'] });
      toast.success(t('system.settingsSaved'));
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || t('system.saveFailed'));
    },
  });

  const onSubmit = (data: SystemSettingsFormData) => {
    mutation.mutate({
      appName: data.appName,
      appUrl: data.appUrl,
      retentionDays: data.retentionDays,
      updateCheckEnabled: data.updateCheckEnabled,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <Spinner className="mx-auto text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('system.systemSettingsSimple')}</CardTitle>
        <CardDescription>{t('system.systemSettingsSimpleDescription')}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="app-name">
              {t('system.applicationNameLabel')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="app-name"
              placeholder={t('system.applicationNamePlaceholder')}
              {...register('appName')}
              aria-invalid={!!errors.appName}
            />
            {errors.appName && <p className="text-sm text-destructive">{errors.appName.message}</p>}
            <p className="text-xs text-muted-foreground">
              {t('system.applicationNameHint')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="app-url">{t('system.applicationUrl')}</Label>
            <Input
              id="app-url"
              type="url"
              placeholder={t('system.applicationUrlPlaceholder')}
              {...register('appUrl')}
              aria-invalid={!!errors.appUrl}
            />
            {errors.appUrl && <p className="text-sm text-destructive">{errors.appUrl.message}</p>}
            <p className="text-xs text-muted-foreground">
              {t('system.applicationUrlHint')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="retention-days">
              {t('system.dataRetention')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="retention-days"
              type="number"
              min={0}
              max={3650}
              {...register('retentionDays', { valueAsNumber: true })}
              aria-invalid={!!errors.retentionDays}
            />
            {errors.retentionDays && (
              <p className="text-sm text-destructive">{errors.retentionDays.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {t('system.dataRetentionHint')}
            </p>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="update-check">{t('system.checkForUpdates')}</Label>
              <p className="text-xs text-muted-foreground">
                {t('system.checkForUpdatesHint')}
              </p>
            </div>
            <Controller
              control={control}
              name="updateCheckEnabled"
              render={({ field }) => (
                <Switch
                  id="update-check"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Spinner size="sm" className="mr-2" />
                {t('common.saving')}
              </>
            ) : (
              t('system.saveChanges')
            )}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
