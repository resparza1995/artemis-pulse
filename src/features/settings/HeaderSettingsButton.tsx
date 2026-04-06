import { Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { I18nProvider, useI18n } from "../../i18n/react";
import type { Locale } from "../../i18n";
import { toastManager } from "../../lib/toast";
import type { AppSettings, AppSettingsResponse } from "../../types/settings";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Modal } from "../../ui/modal";

type SettingsApiError = { message?: string };
type HeaderSettingsButtonProps = { locale: Locale };

const EMPTY_SETTINGS: AppSettings = { artemisBaseUrl: "", artemisUsername: "", artemisPassword: "", pollIntervalMs: 3000 };

function isSettingsResponse(payload: unknown): payload is AppSettingsResponse {
  return Boolean(payload && typeof payload === "object" && "settings" in payload && payload.settings && typeof payload.settings === "object");
}

function getErrorMessage(payload: unknown, fallback: string) {
  return payload && typeof payload === "object" && "message" in payload && typeof (payload as SettingsApiError).message === "string"
    ? (payload as SettingsApiError).message!
    : fallback;
}

function HeaderSettingsButtonInner() {
  const { messages } = useI18n();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(EMPTY_SETTINGS);
  const [persisted, setPersisted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function loadSettings() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const response = await fetch("/api/settings", { headers: { Accept: "application/json" } });
        let payload: unknown = null;
        try { payload = await response.json(); } catch { payload = null; }
        if (!response.ok) throw new Error(getErrorMessage(payload, messages.settings.fetchError));
        if (!isSettingsResponse(payload)) throw new Error(messages.settings.invalidFetch);
        if (!cancelled) {
          setSettings(payload.settings);
          setPersisted(payload.persisted);
        }
      } catch (error) {
        if (!cancelled) setErrorMessage(error instanceof Error ? error.message : messages.settings.fetchError);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadSettings();
    return () => { cancelled = true; };
  }, [open, messages.settings.fetchError, messages.settings.invalidFetch]);

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      let payload: unknown = null;
      try { payload = await response.json(); } catch { payload = null; }
      if (!response.ok) throw new Error(getErrorMessage(payload, messages.settings.saveError));
      if (!isSettingsResponse(payload)) throw new Error(messages.settings.invalidSave);
      toastManager.success(messages.settings.saveSuccess);
      setOpen(false);
      window.setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      const message = error instanceof Error ? error.message : messages.settings.saveError;
      setErrorMessage(message);
      toastManager.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <Button type="button" variant="secondary" className="h-9 w-9 rounded-full px-0" onClick={() => setOpen(true)} aria-label={messages.layout.settingsLabel} title={messages.layout.settingsLabel}>
        <Settings2 className="h-4 w-4" />
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={messages.settings.title}
        description={messages.settings.description}
        className="max-w-3xl min-h-[34rem]"
        footer={<div className="flex flex-wrap items-center justify-end gap-3"><Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isSaving}>{messages.common.cancel}</Button><Button type="button" onClick={() => void handleSave()} disabled={isSaving || isLoading}>{isSaving ? messages.settings.savingButton : messages.settings.saveButton}</Button></div>}
      >
        <div className="space-y-4">
          <div className="app-panel-soft rounded-2xl p-4 text-sm text-muted-foreground">
            <p>{persisted ? messages.settings.sourcePersisted : messages.settings.sourceDefault}</p>
            <p>{messages.settings.reloadHint}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-foreground md:col-span-2"><span>{messages.settings.baseUrl}</span><Input value={settings.artemisBaseUrl} onChange={(event) => setSettings((current) => ({ ...current, artemisBaseUrl: event.target.value }))} placeholder="http://localhost:8161/console/jolokia" disabled={isLoading || isSaving} autoFocus /></label>
            <label className="space-y-2 text-sm text-foreground"><span>{messages.settings.username}</span><Input value={settings.artemisUsername} onChange={(event) => setSettings((current) => ({ ...current, artemisUsername: event.target.value }))} placeholder="admin" disabled={isLoading || isSaving} /></label>
            <label className="space-y-2 text-sm text-foreground"><span>{messages.settings.password}</span><Input type="password" value={settings.artemisPassword} onChange={(event) => setSettings((current) => ({ ...current, artemisPassword: event.target.value }))} placeholder="admin123" disabled={isLoading || isSaving} /></label>
            <label className="space-y-2 text-sm text-foreground"><span>{messages.settings.pollInterval}</span><Input type="number" min={500} step={100} value={String(settings.pollIntervalMs)} onChange={(event) => setSettings((current) => ({ ...current, pollIntervalMs: Number(event.target.value || 0) }))} placeholder="3000" disabled={isLoading || isSaving} /></label>
          </div>
          {errorMessage ? <div className="app-notice app-notice-critical text-sm">{errorMessage}</div> : null}
        </div>
      </Modal>
    </>
  );
}

export function HeaderSettingsButton({ locale }: HeaderSettingsButtonProps) {
  return <I18nProvider locale={locale}><HeaderSettingsButtonInner /></I18nProvider>;
}
