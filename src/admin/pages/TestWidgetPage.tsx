import { useState, useEffect, useCallback } from 'react';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { Spinner } from '../components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Progress } from '../components/ui/progress';
import {
  Moon,
  Sun,
  LayoutDashboard,
  TrendingUp,
  FileText,
  Users,
  FolderOpen,
  Settings,
  Bug,
  MessageSquare,
  BookOpen,
} from 'lucide-react';

const STORAGE_KEY = 'bugpin_test_api_key';

const getStats = () => [
  { label: i18next.t('testWidget.totalRevenue'), value: '$45,231', change: '+12.5%', positive: true },
  { label: i18next.t('testWidget.activeUsers'), value: '2,847', change: '+8.3%', positive: true },
  { label: i18next.t('testWidget.conversionRate'), value: '3.24%', change: '-2.1%', positive: false },
  { label: i18next.t('testWidget.avgSession'), value: '4m 32s', change: '+5.7%', positive: true },
];

const TRANSACTIONS = [
  {
    id: '#TXN-001',
    customer: 'John Smith',
    date: '2026-01-07',
    amount: '$249.99',
    status: 'Completed',
  },
  {
    id: '#TXN-002',
    customer: 'Sarah Johnson',
    date: '2026-01-07',
    amount: '$149.50',
    status: 'Completed',
  },
  {
    id: '#TXN-003',
    customer: 'Michael Chen',
    date: '2026-01-06',
    amount: '$599.00',
    status: 'Pending',
  },
  {
    id: '#TXN-004',
    customer: 'Emily Davis',
    date: '2026-01-06',
    amount: '$89.99',
    status: 'Failed',
  },
  {
    id: '#TXN-005',
    customer: 'David Wilson',
    date: '2026-01-05',
    amount: '$399.99',
    status: 'Completed',
  },
];

const PROJECTS = [
  { name: 'Website Redesign', progress: 85, color: 'bg-primary' },
  { name: 'Mobile App Development', progress: 62, color: 'bg-green-500' },
  { name: 'API Integration', progress: 45, color: 'bg-yellow-500' },
  { name: 'Database Migration', progress: 28, color: 'bg-red-500' },
];

const CHART_BARS = [
  { height: 65, color: 'bg-blue-500' },
  { height: 85, color: 'bg-green-500' },
  { height: 75, color: 'bg-yellow-500' },
  { height: 90, color: 'bg-red-500' },
  { height: 70, color: 'bg-blue-500' },
  { height: 95, color: 'bg-green-500' },
  { height: 80, color: 'bg-yellow-500' },
];

const getChartLegend = () => [
  { label: i18next.t('testWidget.janMar'), color: 'bg-blue-500' },
  { label: i18next.t('testWidget.aprJun'), color: 'bg-green-500' },
  { label: i18next.t('testWidget.julSep'), color: 'bg-yellow-500' },
  { label: i18next.t('testWidget.octDec'), color: 'bg-red-500' },
];

const getNavSections = () => [
  {
    title: i18next.t('testWidget.navMain'),
    items: [
      { icon: LayoutDashboard, label: i18next.t('testWidget.dashboard'), active: true },
      { icon: TrendingUp, label: i18next.t('testWidget.navAnalytics') },
      { icon: FileText, label: i18next.t('testWidget.navReports') },
    ],
  },
  {
    title: i18next.t('testWidget.navManagement'),
    items: [
      { icon: Users, label: i18next.t('testWidget.navUsers') },
      { icon: FolderOpen, label: i18next.t('testWidget.navProjects') },
      { icon: Settings, label: i18next.t('testWidget.settings') },
    ],
  },
  {
    title: i18next.t('testWidget.navSupport'),
    items: [
      { icon: Bug, label: i18next.t('testWidget.navBugReports') },
      { icon: MessageSquare, label: i18next.t('testWidget.navFeedback') },
      { icon: BookOpen, label: i18next.t('testWidget.navDocumentation') },
    ],
  },
];

function getStatusBadgeClasses(status: string): string {
  switch (status) {
    case 'Completed':
      return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400';
    case 'Pending':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400';
    case 'Failed':
      return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-400';
  }
}

export function TestWidgetPage() {
  const { t } = useTranslation('testWidget');
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [screenshotMode, setScreenshotMode] = useState(false);

  const { resolvedTheme, setTheme } = useTheme();

  // Get API key from URL params or localStorage
  const getApiKey = useCallback(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlKey = urlParams.get('apiKey');
    if (urlKey) {
      localStorage.setItem(STORAGE_KEY, urlKey);
      return urlKey;
    }
    return localStorage.getItem(STORAGE_KEY);
  }, []);

  // Initialize API key on mount
  useEffect(() => {
    const key = getApiKey();
    if (key) {
      setApiKey(key);
    } else {
      setShowApiKeyModal(true);
    }
    setIsInitialLoad(false);
  }, [getApiKey]);

  // Load widget script when API key is available
  useEffect(() => {
    if (!apiKey) return;

    // Check if widget script already exists
    const existingScript = document.querySelector('script[data-api-key]');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.src = '/widget.js?v=' + Date.now();
    script.setAttribute('data-api-key', apiKey);
    document.body.appendChild(script);

    // Set up test storage data for Storage Keys demo
    localStorage.setItem('bugpin_test_user_prefs', 'dark_mode');
    localStorage.setItem('bugpin_test_cart_items', '3');
    sessionStorage.setItem('bugpin_test_session_id', 'sess_abc123');
    sessionStorage.setItem('bugpin_test_last_page', '/dashboard');
    document.cookie = 'bugpin_test_cookie=demo_value; path=/';
    document.cookie = 'bugpin_test_theme=dark; path=/';

    // Simulate errors after widget loads to test automatic capture
    // Use window.fetch explicitly to ensure it uses the patched version
    const timer = setTimeout(() => {
      console.error('Auto-captured error: Something went wrong on page load!');
      console.warn('Auto-captured warning: Deprecated API usage detected');
      window.fetch('/api/does-not-exist-auto-test');
    }, 2000);

    return () => {
      clearTimeout(timer);
      const scriptToRemove = document.querySelector('script[data-api-key]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [apiKey]);

  const handleSaveApiKey = () => {
    const trimmedKey = apiKeyInput.trim();

    if (!trimmedKey) {
      alert('Please enter an API key');
      return;
    }

    if (!trimmedKey.startsWith('proj_')) {
      alert('API key should start with "proj_"');
      return;
    }

    localStorage.setItem(STORAGE_KEY, trimmedKey);
    setApiKey(trimmedKey);
    setShowApiKeyModal(false);
    setApiKeyInput('');
  };

  const handleChangeApiKey = () => {
    setApiKeyInput(apiKey || '');
    setShowApiKeyModal(true);
  };

  const handleCancelApiKeyChange = () => {
    // Only allow cancel if we already have an API key
    if (apiKey) {
      setShowApiKeyModal(false);
      setApiKeyInput('');
    }
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
  };

  // Don't render until we've checked for API key
  if (isInitialLoad) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Spinner size="lg" className="text-primary" />
      </div>
    );
  }

  // Screenshot mode - white background with toggle button at the bottom (scroll to see it)
  if (screenshotMode) {
    return (
      <div className="min-h-[200vh] bg-white">
        <div className="h-screen" /> {/* Empty space for clean screenshot area */}
        <div className="flex justify-center py-8">
          <Button
            variant="outline"
            size="sm"
            className="bg-white shadow-lg"
            onClick={() => setScreenshotMode(false)}
          >
            {t('testWidget.exitScreenshotMode')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-muted/50">
      {/* API Key Modal */}
      <Dialog
        open={showApiKeyModal}
        onOpenChange={(open) => !open && apiKey && setShowApiKeyModal(false)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('testWidget.enterApiKeyTitle')}</DialogTitle>
            <DialogDescription>
              {t('testWidget.enterApiKeyDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="proj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="font-mono"
              onKeyDown={(e) => e.key === 'Enter' && handleSaveApiKey()}
            />
          </div>
          <DialogFooter>
            {apiKey && (
              <Button variant="secondary" onClick={handleCancelApiKeyChange}>
                {t('common.cancel')}
              </Button>
            )}
            <Button onClick={handleSaveApiKey}>{t('testWidget.continueBtn')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* API Key Notice Banner */}
      {apiKey && (
        <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-5 py-3 text-center text-sm border-b border-green-200 dark:border-green-800 flex-shrink-0">
          {t('testWidget.apiKeyColon')}{' '}
          <code className="bg-green-200 dark:bg-green-800 px-1.5 py-0.5 rounded font-mono text-xs">
            {apiKey}
          </code>
          <Button
            variant="secondary"
            size="sm"
            className="ml-3 h-7 bg-green-600 hover:bg-green-700 text-white"
            onClick={handleChangeApiKey}
          >
            {t('testWidget.changeBtn')}
          </Button>
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 bg-zinc-800 dark:bg-zinc-900 text-white overflow-y-auto">
          <div className="px-5 py-5 border-b border-zinc-700">
            <div className="text-2xl font-semibold">{t('testWidget.bugpinTest')}</div>
            <div className="text-xs text-zinc-400 mt-1">{t('testWidget.widgetTestingDashboard')}</div>
          </div>

          <nav className="py-5">
            {getNavSections().map((section) => (
              <div key={section.title} className="mb-6">
                <div className="px-5 text-[11px] uppercase text-zinc-500 font-semibold mb-2">
                  {section.title}
                </div>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className={`px-5 py-3 flex items-center gap-3 cursor-pointer transition-colors hover:bg-zinc-700 ${
                        item.active ? 'bg-zinc-700 border-l-3 border-blue-500 pl-[17px]' : ''
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-h-0">
          {/* Header */}
          <header className="bg-background border-b px-8 h-16 flex items-center justify-between flex-shrink-0">
            <h1 className="text-xl font-semibold">{t('testWidget.dashboardOverview')}</h1>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={toggleTheme}>
                {resolvedTheme === 'light' ? (
                  <>
                    <Moon className="h-4 w-4 mr-2" />
                    {t('testWidget.darkModeBtn')}
                  </>
                ) : (
                  <>
                    <Sun className="h-4 w-4 mr-2" />
                    {t('testWidget.lightModeBtn')}
                  </>
                )}
              </Button>
            </div>
          </header>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              {getStats().map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="p-6">
                    <div className="text-sm text-muted-foreground mb-2">{stat.label}</div>
                    <div className="text-3xl font-bold mb-2">{stat.value}</div>
                    <div
                      className={`text-sm flex items-center gap-1 ${
                        stat.positive
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {stat.positive ? '↑' : '↓'} {stat.change} {t('testWidget.fromLastMonth')}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Monthly Performance Chart */}
            <Card className="mb-5">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle>{t('testWidget.monthlyPerformance')}</CardTitle>
                <Button variant="secondary">{t('testWidget.exportData')}</Button>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted/50 rounded-lg flex items-end gap-2 p-5">
                  {CHART_BARS.map((bar, index) => (
                    <div
                      key={index}
                      className={`flex-1 ${bar.color} rounded-t transition-all hover:opacity-80`}
                      style={{ height: `${bar.height}%` }}
                    />
                  ))}
                </div>
                <div className="flex gap-5 mt-4 flex-wrap">
                  {getChartLegend().map((item) => (
                    <div key={item.label} className="flex items-center gap-2 text-sm">
                      <div className={`w-4 h-4 rounded ${item.color}`} />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Transactions Table */}
            <Card className="mb-5">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle>{t('testWidget.recentTransactions')}</CardTitle>
                <Button variant="secondary">{t('testWidget.viewAll')}</Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('testWidget.transactionId')}</TableHead>
                      <TableHead>{t('testWidget.customer')}</TableHead>
                      <TableHead>{t('testWidget.date')}</TableHead>
                      <TableHead>{t('testWidget.amount')}</TableHead>
                      <TableHead>{t('testWidget.statusCol')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {TRANSACTIONS.map((txn) => {
                      const statusLabel =
                        txn.status === 'Completed'
                          ? t('testWidget.txStatusCompleted')
                          : txn.status === 'Pending'
                          ? t('testWidget.txStatusPending')
                          : txn.status === 'Failed'
                          ? t('testWidget.txStatusFailed')
                          : txn.status;
                      return (
                        <TableRow key={txn.id}>
                          <TableCell className="font-medium">{txn.id}</TableCell>
                          <TableCell>{txn.customer}</TableCell>
                          <TableCell>{txn.date}</TableCell>
                          <TableCell>{txn.amount}</TableCell>
                          <TableCell>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClasses(
                                txn.status,
                              )}`}
                            >
                              {statusLabel}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Project Progress */}
            <Card className="mb-5">
              <CardHeader>
                <CardTitle>{t('testWidget.projectProgress')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {PROJECTS.map((project) => (
                  <div key={project.name}>
                    <div className="flex justify-between mb-2">
                      <span>{project.name}</span>
                      <span className="text-muted-foreground">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className={project.color} />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Error Testing */}
            <Card className="mb-5 border-dashed border-2 border-orange-300 dark:border-orange-700">
              <CardHeader>
                <CardTitle className="text-orange-600 dark:text-orange-400">
                  {t('testWidget.errorCaptureTesting')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t('testWidget.errorCaptureTestingHint')}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => console.error('Test error: Something went wrong!')}
                  >
                    {t('testWidget.triggerConsoleError')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                    onClick={() => console.warn('Test warning: Deprecated API usage detected')}
                  >
                    {t('testWidget.triggerConsoleWarning')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.fetch('/api/non-existent-endpoint-404')}
                  >
                    {t('testWidget.trigger404Error')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // @ts-expect-error intentional error for testing
                      undefinedFunction();
                    }}
                  >
                    {t('testWidget.triggerJsError')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* User Activity Tracking Demo */}
            <Card className="mb-5 border-dashed border-2 border-blue-300 dark:border-blue-700">
              <CardHeader>
                <CardTitle className="text-blue-600 dark:text-blue-400">
                  {t('testWidget.userActivityDemo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t('testWidget.userActivityDemoHint')}
                </p>

                {/* Action Buttons */}
                <div>
                  <Label className="text-xs uppercase text-muted-foreground mb-2 block">
                    {t('testWidget.actionButtons')}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => alert(t('testWidget.saveClicked'))}>
                      {t('testWidget.saveChanges')}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => alert(t('testWidget.cancelClicked'))}>
                      {t('common.cancel')}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => alert(t('testWidget.settingsClicked'))}>
                      {t('testWidget.openSettings')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => alert(t('testWidget.helpClicked'))}>
                      {t('testWidget.getHelp')}
                    </Button>
                  </div>
                </div>

                {/* Links */}
                <div>
                  <Label className="text-xs uppercase text-muted-foreground mb-2 block">
                    {t('testWidget.navigationLinks')}
                  </Label>
                  <div className="flex flex-wrap gap-4">
                    <a
                      href="#dashboard"
                      className="text-primary hover:underline"
                      onClick={(e) => {
                        e.preventDefault();
                        history.pushState({}, '', '#dashboard');
                      }}
                    >
                      {t('testWidget.dashboard')}
                    </a>
                    <a
                      href="#settings"
                      className="text-primary hover:underline"
                      onClick={(e) => {
                        e.preventDefault();
                        history.pushState({}, '', '#settings');
                      }}
                    >
                      {t('testWidget.settings')}
                    </a>
                    <a
                      href="#profile"
                      className="text-primary hover:underline"
                      onClick={(e) => {
                        e.preventDefault();
                        history.pushState({}, '', '#profile');
                      }}
                    >
                      {t('testWidget.profile')}
                    </a>
                    <a
                      href="https://example.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {t('testWidget.externalLink')}
                    </a>
                  </div>
                </div>

                {/* Form Inputs */}
                <div>
                  <Label className="text-xs uppercase text-muted-foreground mb-2 block">
                    {t('testWidget.formInteractions')}
                  </Label>
                  <div className="flex flex-wrap gap-3 items-center">
                    <Input placeholder={t('testWidget.clickToFocus')} className="w-48" name="demo_input" />
                    <Select>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder={t('testWidget.selectOption')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="opt1">{t('testWidget.option1')}</SelectItem>
                        <SelectItem value="opt2">{t('testWidget.option2')}</SelectItem>
                        <SelectItem value="opt3">{t('testWidget.option3')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">{t('testWidget.checkboxLabel')}</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Storage Keys Demo */}
            <Card className="mb-5 border-dashed border-2 border-purple-300 dark:border-purple-700">
              <CardHeader>
                <CardTitle className="text-purple-600 dark:text-purple-400">
                  {t('testWidget.storageKeysDemo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t('testWidget.storageKeysDemoHint')}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <Label className="text-xs uppercase text-muted-foreground mb-2 block">
                      {t('testWidget.cookiesLabel')}
                    </Label>
                    <div className="space-y-1 text-sm font-mono">
                      <div>bugpin_test_cookie</div>
                      <div>bugpin_test_theme</div>
                    </div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <Label className="text-xs uppercase text-muted-foreground mb-2 block">
                      {t('testWidget.localStorageLabel')}
                    </Label>
                    <div className="space-y-1 text-sm font-mono">
                      <div>bugpin_test_user_prefs</div>
                      <div>bugpin_test_cart_items</div>
                    </div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <Label className="text-xs uppercase text-muted-foreground mb-2 block">
                      {t('testWidget.sessionStorageLabel')}
                    </Label>
                    <div className="space-y-1 text-sm font-mono">
                      <div>bugpin_test_session_id</div>
                      <div>bugpin_test_last_page</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      localStorage.setItem('bugpin_dynamic_key_' + Date.now(), 'value');
                      alert(t('testWidget.newLocalStorageKey'));
                    }}
                  >
                    {t('testWidget.addLocalStorageKey')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      sessionStorage.setItem('bugpin_dynamic_session_' + Date.now(), 'value');
                      alert(t('testWidget.newSessionStorageKey'));
                    }}
                  >
                    {t('testWidget.addSessionStorageKey')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      document.cookie = `bugpin_dynamic_${Date.now()}=value; path=/`;
                      alert(t('testWidget.newCookieAdded'));
                    }}
                  >
                    {t('testWidget.addCookieBtn')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Screenshot Mode Toggle */}
            <div className="flex justify-center py-8">
              <Button
                variant="outline"
                size="lg"
                className="border-dashed border-2"
                onClick={() => setScreenshotMode(true)}
              >
                {t('testWidget.enterScreenshotMode')}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
