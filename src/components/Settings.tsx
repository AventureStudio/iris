import type { Lang } from "../types";
import type { Settings as SettingsModel } from "../lib/settings";
import { LANG_LABELS, t } from "../i18n";
import { listVoices } from "../lib/speech";

const LANGS: Lang[] = ["nl", "en", "fr"];

interface Props {
  settings: SettingsModel;
  onChange: (patch: Partial<SettingsModel>) => void;
  onClose: () => void;
}

export function Settings({ settings, onChange, onClose }: Props) {
  const voices = listVoices();
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={t("settings", settings.lang)}>
      <div className="modal__card">
        <h2 className="modal__title">⚙️ {t("settings", settings.lang)}</h2>

        <label className="field">
          <span>{t("language", settings.lang)}</span>
          <select
            value={settings.lang}
            onChange={(e) => onChange({ lang: e.target.value as Lang })}
          >
            {LANGS.map((l) => (
              <option key={l} value={l}>{LANG_LABELS[l]}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>
            {t("dwellTime", settings.lang)}: {(settings.dwellMs / 1000).toFixed(1)}
            {t("seconds", settings.lang)}
          </span>
          <input
            type="range"
            min={600}
            max={4000}
            step={100}
            value={settings.dwellMs}
            onChange={(e) => onChange({ dwellMs: Number(e.target.value) })}
          />
        </label>

        <label className="field">
          <span>{t("voice", settings.lang)}</span>
          <select
            value={settings.voiceName}
            onChange={(e) => onChange({ voiceName: e.target.value })}
          >
            <option value="">{t("defaultVoice", settings.lang)}</option>
            {voices.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </label>

        <button type="button" className="modal__close" onClick={onClose}>
          {t("close", settings.lang)}
        </button>
      </div>
    </div>
  );
}
