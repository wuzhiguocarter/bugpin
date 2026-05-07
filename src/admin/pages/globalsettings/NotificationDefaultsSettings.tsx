import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Spinner } from '../../components/ui/spinner';
import { NotificationSettingsForm } from '../../components/NotificationSettingsForm';
import type { AppSettings, NotificationDefaultSettings } from '@shared/types';

export function NotificationDefaultsSettings() {
  const { t } = useTranslation('globalSettings');
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<NotificationDefaultSettings>>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data.settings as AppSettings;
    },
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings.notifications);
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: async (data: { notifications: Partial<NotificationDefaultSettings> }) => {
      const response = await api.put('/settings', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success(t('globalSettings.notificationDefaultsSaved'));
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || t('globalSettings.notificationDefaultsSaveFailed'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ notifications: formData });
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
        <CardTitle>{t('globalSettings.notificationDefaults')}</CardTitle>
        <CardDescription>
          {t('globalSettings.notificationDefaultsLong')}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <NotificationSettingsForm value={formData} onChange={setFormData} />
          <div className="pt-4">
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
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
