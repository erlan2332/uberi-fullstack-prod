import { useState } from "react";
import Button from "../components/ui/Button.jsx";
import { features, popularServices, reviews } from "../data/mock.js";
import imgPageHouse from "../img/dizayn-interera-bolshoy-kvartiry-v-sovremennom-stile.jpg"
import trackMers from "../img/screenshot_2022_06_21_at_17_30_44_sprinter_limited_edition_malotonnagnie_avtomobili_mercedes_benz.jpg"
import houseImg from "../img/794.7b.jpg"
import humanEmployee from "../img/two-trained-furniture-movers-team-600nw-2648392553.webp"

const CONTACT_PHONE = "+7 967 257-64-36";
const CONTACT_PHONE_FOR_WHATSAPP = CONTACT_PHONE.replace(/\D/g, "");
const WHATSAPP_LINK = `https://wa.me/${CONTACT_PHONE_FOR_WHATSAPP}`;
const TELEGRAM_USERNAME = "Ruslan94_94";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL
  || (window.location.hostname === "localhost"
    ? "http://localhost:8082"
    : "https://uberi-api-vyvoz.fly.dev");
const PHONE_PATTERN = /^[0-9+()\-\s]{6,30}$/;
const INITIAL_LEAD_FORM = {
  name: "",
  phone: "",
  executionDate: "",
  address: "",
  pickupItems: "",
  hasElevator: true,
};

const IMAGES = {
  about: "https://picsum.photos/seed/ubere-about/1200/800",
  big: "https://picsum.photos/seed/ubere-big/1200/900",
  small1: "https://picsum.photos/seed/ubere-small-1/1200/900",
  small2: "https://picsum.photos/seed/ubere-small-2/1200/900",
};

const kpis = [
  { value: "9–21", label: "Работаем ежедневно" },
  { value: "2", label: "Интервала в день" },
  { value: "15 мин", label: "Оценка по фото" },
  { value: "Фикс", label: "Цена до выезда" },
];

const rows = [
  {
    title: "Вывоз крупногабаритных вещей",
    desc: "Шкафы, диваны, ванны и тяжёлые предметы — аккуратно вынесем и вывезем.",
    date: "По записи",
  },
  {
    title: "Вывоз техники",
    desc: "Стиральные машины, холодильники, плиты — вынесем, погрузим, вывезем.",
    date: "По записи",
  },
  {
    title: "Вывоз мебели",
    desc: "Диваны, шкафы, матрасы — при необходимости разберём и вынесем бережно.",
    date: "По записи",
  },
  {
    title: "Металл и вторсырьё",
    desc: "Сортируем и отправляем на переработку то, что возможно переработать.",
    date: "По записи",
  },
];

const icons = ["🚚", "🧺", "🛋️", "♻️"];

function WhatsappIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.52 3.449A11.861 11.861 0 0012.07 0C5.532 0 .207 5.325.207 11.864c0 2.091.547 4.133 1.588 5.934L0 24l6.356-1.667a11.82 11.82 0 005.71 1.455h.005c6.535 0 11.862-5.326 11.862-11.865a11.79 11.79 0 00-3.413-8.474zm-8.45 18.3h-.004a9.86 9.86 0 01-5.026-1.378l-.361-.214-3.77.989 1.006-3.675-.235-.377a9.86 9.86 0 01-1.509-5.251c.002-5.448 4.436-9.882 9.889-9.882a9.82 9.82 0 016.993 2.899 9.825 9.825 0 012.896 6.998c-.003 5.45-4.436 9.881-9.879 9.881zm5.421-7.395c-.297-.149-1.758-.867-2.03-.967-.273-.099-.47-.148-.669.149-.198.298-.768.967-.941 1.166-.173.198-.347.223-.644.074-.297-.148-1.255-.463-2.39-1.475-.883-.787-1.479-1.76-1.652-2.058-.173-.297-.018-.458.13-.606.133-.132.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.52-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.009-.372-.011-.57-.011-.198 0-.52.074-.792.372-.273.297-1.04 1.016-1.04 2.479 0 1.463 1.065 2.877 1.213 3.075.149.198 2.095 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.414.248-.694.248-1.29.173-1.413-.074-.124-.272-.198-.57-.347z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12a12 12 0 0012-12A12 12 0 0011.944 0zm5.392 8.208l-1.97 9.288c-.148.658-.532.82-1.078.51l-2.982-2.2-1.438 1.384c-.16.16-.293.293-.6.293l.214-3.054 5.56-5.022c.24-.214-.054-.334-.373-.12l-6.87 4.326-2.96-.924c-.644-.203-.657-.644.135-.954l11.57-4.458c.538-.196 1.006.128.83.931z" />
    </svg>
  );
}

function validateLeadForm({ name, phone, executionDate, address, pickupItems }) {
  const errors = {};

  if (!name) {
    errors.name = "Введите имя";
  } else if (name.length > 80) {
    errors.name = "Имя должно быть не длиннее 80 символов";
  }

  if (!phone) {
    errors.phone = "Введите телефон";
  } else if (!PHONE_PATTERN.test(phone)) {
    errors.phone = "Телефон: 6-30 символов, только цифры и + ( ) -";
  }

  if (!executionDate) {
    errors.executionDate = "Укажите дату выполнения";
  }

  if (!address) {
    errors.address = "Укажите адрес";
  } else if (address.length > 220) {
    errors.address = "Адрес должен быть не длиннее 220 символов";
  }

  if (!pickupItems) {
    errors.pickupItems = "Укажите, что нужно забрать";
  } else if (pickupItems.length > 600) {
    errors.pickupItems = "Описание должно быть не длиннее 600 символов";
  }

  return errors;
}

export default function Home() {
  const [leadForm, setLeadForm] = useState(INITIAL_LEAD_FORM);
  const [leadFormErrors, setLeadFormErrors] = useState({});
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadSubmitState, setLeadSubmitState] = useState({ type: "idle", message: "" });

  async function handleLeadSubmit(event) {
    event.preventDefault();

    const payload = {
      name: leadForm.name.trim(),
      phone: leadForm.phone.trim(),
      executionDate: leadForm.executionDate.trim(),
      address: leadForm.address.trim(),
      pickupItems: leadForm.pickupItems.trim(),
      elevatorAvailable: leadForm.hasElevator,
    };
    const validationErrors = validateLeadForm(payload);

    if (Object.keys(validationErrors).length > 0) {
      setLeadFormErrors(validationErrors);
      setLeadSubmitState({
        type: "error",
        message: "Проверьте поля формы",
      });
      return;
    }

    setLeadFormErrors({});
    setIsSubmittingLead(true);
    setLeadSubmitState({ type: "idle", message: "" });

    try {
      const response = await fetch(`${API_BASE_URL}/api/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseBody = await response.json().catch(() => null);

      if (!response.ok) {
        setLeadSubmitState({
          type: "error",
          message: responseBody?.message || "Не удалось отправить заявку. Попробуйте ещё раз.",
        });
        return;
      }

      setLeadSubmitState({
        type: "success",
        message: responseBody?.message || "Заявка отправлена. Скоро свяжемся с вами.",
      });
      setLeadForm(INITIAL_LEAD_FORM);
      setLeadFormErrors({});
    } catch (error) {
      setLeadSubmitState({
        type: "error",
        message: error instanceof TypeError
          ? `Нет соединения с сервером. Запустите backend.`
          : "Не удалось отправить заявку. Попробуйте ещё раз.",
      });
    } finally {
      setIsSubmittingLead(false);
    }
  }

  return (
    <main className="page">
      {/* HERO */}
      <section className="hero">
        <div className="hero__media">
          <img
            className="hero__img"
            src={imgPageHouse}
            alt="Вывоз мебели и техники по всей России"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
          <div className="hero__overlay" />
          <h1 className="hero__title">Убери лишнее</h1>

          <div className="hero__panel">
            <div className="hero__panelText">
              Вывоз ненужных вещей, техники и мебели — быстро и аккуратно.
              <span className="hero__panelAccent">По всей России.</span>
            </div>

            <div className="hero__panelActions">
              <Button
                variant="primary"
                onClick={() => document.querySelector("#contacts")?.scrollIntoView({ behavior: "smooth" })}
              >
                Заказать вывоз
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* KPI */}
      <section className="section">
        <div className="kpis">
          {kpis.map((k) => (
            <div className="kpi" key={k.label}>
              <div className="kpi__v">{k.value}</div>
              <div className="kpi__l">{k.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section className="section" id="about">
        <div className="twoCol">
          <div>
            <div className="section__label">О проекте</div>
            <h2 className="section__title">Убери</h2>
            <p className="section__text">
              Мы делаем вывоз понятным: сначала согласуем объём и стоимость, затем приезжаем
              в выбранный интервал и аккуратно выносим/погружаем вещи. Что возможно — отправляем
              на переработку.
            </p>

            <Button
              variant="primary"
              onClick={() => document.querySelector("#services")?.scrollIntoView({ behavior: "smooth" })}
            >
              Посмотреть услуги
            </Button>
          </div>

          <div className="imgCard">
            <img src={trackMers} alt="Фото про сервис" loading="lazy" />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section" id="services">
        <div className="sectionHead">
          <div>
            <div className="section__label">Почему удобно</div>
            <h2 className="section__title">Всё разложено по полочкам</h2>
          </div>
        </div>

        <div className="grid4">
          {features.map((f) => (
            <div className="card" key={f.title}>
              <div className="card__title">{f.title}</div>
              <div className="card__text">{f.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PHOTO BLOCKS */}
      <section className="section">
        <div className="mosaic">
          <div className="mosaic__big">
            <img src={houseImg} alt="Большое фото" loading="lazy" />
            <div className="mosaic__cap">
              <div className="chip">Стильный порядок</div>
              <div className="mosaic__title">Просто, чисто, понятно</div>
            </div>
          </div>

          <div className="mosaic__stack">
            <div className="mosaic__small">
              <img src={humanEmployee} alt="Фото 1" loading="lazy" />
              <div className="mosaic__cap">
                <div className="chip">Комфорт</div>
                <div className="mosaic__title">Аккуратная команда</div>
              </div>
            </div>

            <div className="mosaic__small">
              <img src={IMAGES.small2} alt="Фото 2" loading="lazy" />
              <div className="mosaic__cap">
                <div className="chip">Скорость</div>
                <div className="mosaic__title">Удобные интервалы</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ✅ NEW PRICES BLOCK */}
      <section className="section" id="prices">
        <div className="sectionHead">
          <div>
            <h2 className="section__title">Что вывозим чаще всего</h2>
          </div>
        </div>

        <div className="pricesLayout">
          <div className="serviceGrid">
            {rows.map((r, idx) => (
              <article className="serviceCard" key={r.title}>
                <div className="serviceIcon" aria-hidden>
                  {icons[idx] || "✅"}
                </div>

                <div className="serviceBody">
                  <div className="serviceTop">
                    <div className="serviceTitle">{r.title}</div>
                  </div>

                  <div className="serviceDesc">{r.desc}</div>

                  <div className="serviceActions">
                    <Button
                      variant="primary"
                      onClick={() => document.querySelector("#contacts")?.scrollIntoView({ behavior: "smooth" })}
                    >
                      Заказать
                    </Button>

                  </div>
                </div>
              </article>
            ))}
          </div>

          <aside className="priceBox">
            <div className="priceBox__title">Как формируется стоимость</div>

            <ul className="priceList">
              <li>Количество/габариты вещей</li>
              <li>Этаж и наличие лифта</li>
              <li>Нужно ли разбирать мебель</li>
              <li>Подъезд/парковка (если сложно подъехать)</li>
            </ul>

            <div className="priceBox__note">
              Можно прислать фото — оценим быстрее и точнее.
            </div>

            <Button
              variant="primary"
              className="priceBox__btn"
              onClick={() => document.querySelector("#contacts")?.scrollIntoView({ behavior: "smooth" })}
            >
              Получить расчёт
            </Button>

            <div className="muted" style={{ fontSize: 13, marginTop: 10 }}>
              Ответим в течение ~15 минут (в рабочее время).
            </div>
          </aside>
        </div>

        <div className="tagCloud">
          <div className="tagCloud__title">Популярные позиции</div>
          <div className="tagCloud__items">
            {popularServices.slice(0, 10).map((s) => (
              <button
                key={s.name}
                className="tagPill"
                type="button"
                onClick={() => document.querySelector("#contacts")?.scrollIntoView({ behavior: "smooth" })}
                title={`Категория: ${s.tag}`}
              >
                {s.name}
                <span className="tagPill__sub">{s.tag}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* SEO CONTENT */}
      <section className="section seoBlock" id="vyvoz-musora-mebeli-tekhniki">
        <div className="sectionHead">
          <div>
            <h2 className="section__title">Вывоз мусора, мебели и техники</h2>
            <p className="section__hint">
              Работаем с частными и коммерческими заявками. Вывозим старую мебель, бытовую технику,
              телевизоры, холодильники, диваны, шкафы, ванны и строительный мусор.
            </p>
          </div>
        </div>

        <div className="grid2">
          <div className="card">
            <div className="card__title">Что вывозим</div>
            <ul className="seoList">
              <li>Вывоз телевизора, стиральной машины, холодильника</li>
              <li>Вывоз дивана, шкафа, кровати, матраса</li>
              <li>Вывоз металлической ванны и сантехники</li>
              <li>Вывоз хлама из квартиры, офиса, гаража</li>
              <li>Вывоз строительного мусора после ремонта</li>
            </ul>
          </div>

          <div className="card">
            <div className="card__title">Частые вопросы</div>
            <div className="seoFaq">
              <h3>Сколько стоит вывоз мебели и мусора?</h3>
              <p>Стоимость зависит от объёма, этажа, лифта и сложности выноса. Итог согласуем до выезда.</p>
              <h3>Можно ли заказать вывоз в день обращения?</h3>
              <p>Да, если есть свободный интервал. Обычно подтверждаем заявку в течение 15 минут.</p>
            </div>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="section" id="reviews">
        <div className="sectionHead">
          <div>
            <div className="section__label">Отзывы</div>
            <h2 className="section__title">Коротко и по делу</h2>
          </div>
        </div>

        <div className="grid3">
          {reviews.map((r) => (
            <div className="card" key={r.name}>
              <div className="quote">“{r.text}”</div>
              <div className="muted">— {r.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CONTACTS */}
      <section className="section" id="contacts">
        <div className="sectionHead">
          <div>
            <h2 className="section__title">Оставь заявку</h2>
          </div>
        </div>

        <div className="grid2">
          <div className="card">
            <div className="card__title">Связаться</div>
            <div className="contactsInline" style={{ marginTop: 14 }}>
              <a
                className="link contactsInline__phone"
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noreferrer"
                aria-label={`Написать в WhatsApp ${CONTACT_PHONE}`}
              >
                {CONTACT_PHONE}
              </a>
              <a
                className="messengerChip messengerChip--wa"
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noreferrer"
                aria-label={`WhatsApp ${CONTACT_PHONE}`}
              >
                <WhatsappIcon />
                <span>WhatsApp</span>
              </a>
              <a
                className="messengerChip messengerChip--tg"
                href={`https://t.me/${TELEGRAM_USERNAME}`}
                target="_blank"
                rel="noreferrer"
                aria-label={`Telegram @${TELEGRAM_USERNAME}`}
              >
                <TelegramIcon />
                <span>@{TELEGRAM_USERNAME}</span>
              </a>
            </div>
          </div>

          <form className="card contactsForm" onSubmit={handleLeadSubmit}>
            <div className="card__title">Заказать звонок</div>
            <div className="muted" style={{ marginTop: 8 }}>
              Подготовьте фото для расчета стоимости.
            </div>

            <label className="field">
              Имя
              <input
                className="input"
                placeholder="Ваше имя"
                value={leadForm.name}
                onChange={(event) => {
                  const value = event.target.value;
                  setLeadForm((prev) => ({ ...prev, name: value }));
                  setLeadFormErrors((prev) => ({ ...prev, name: undefined }));
                }}
                maxLength={80}
                required
              />
              {leadFormErrors.name && <div className="fieldError">{leadFormErrors.name}</div>}
            </label>

            <label className="field">
              Телефон
              <input
                className="input"
                placeholder="+7..."
                value={leadForm.phone}
                onChange={(event) => {
                  const value = event.target.value;
                  setLeadForm((prev) => ({ ...prev, phone: value }));
                  setLeadFormErrors((prev) => ({ ...prev, phone: undefined }));
                }}
                minLength={6}
                maxLength={30}
                inputMode="tel"
                required
              />
              {leadFormErrors.phone && <div className="fieldError">{leadFormErrors.phone}</div>}
            </label>

            <label className="field">
              Дата выполнения
              <input
                className="input"
                type="date"
                value={leadForm.executionDate}
                onChange={(event) => {
                  const value = event.target.value;
                  setLeadForm((prev) => ({ ...prev, executionDate: value }));
                  setLeadFormErrors((prev) => ({ ...prev, executionDate: undefined }));
                }}
                required
              />
              {leadFormErrors.executionDate && <div className="fieldError">{leadFormErrors.executionDate}</div>}
            </label>

            <label className="field">
              Адрес
              <input
                className="input"
                placeholder="область, город, улица, дом, квартира, подъезд, этаж, домофон"
                value={leadForm.address}
                onChange={(event) => {
                  const value = event.target.value;
                  setLeadForm((prev) => ({ ...prev, address: value }));
                  setLeadFormErrors((prev) => ({ ...prev, address: undefined }));
                }}
                maxLength={220}
                required
              />
              {leadFormErrors.address && <div className="fieldError">{leadFormErrors.address}</div>}
            </label>

            <div className="field">
              Лифт
              <div className="switchGroup" role="group" aria-label="Наличие лифта">
                <button
                  type="button"
                  className={`switchBtn ${leadForm.hasElevator ? "switchBtn--active" : ""}`}
                  onClick={() => setLeadForm((prev) => ({ ...prev, hasElevator: true }))}
                >
                  Есть
                </button>
                <button
                  type="button"
                  className={`switchBtn ${!leadForm.hasElevator ? "switchBtn--active" : ""}`}
                  onClick={() => setLeadForm((prev) => ({ ...prev, hasElevator: false }))}
                >
                  Нет
                </button>
              </div>
            </div>

            <label className="field">
              Что нужно забрать
              <textarea
                className="input input--textarea"
                placeholder="Например: диван, холодильник, 10 мешков мусора"
                value={leadForm.pickupItems}
                onChange={(event) => {
                  const value = event.target.value;
                  setLeadForm((prev) => ({ ...prev, pickupItems: value }));
                  setLeadFormErrors((prev) => ({ ...prev, pickupItems: undefined }));
                }}
                rows={3}
                maxLength={600}
                required
              />
              {leadFormErrors.pickupItems && <div className="fieldError">{leadFormErrors.pickupItems}</div>}
            </label>

            <div className="row">
              <Button variant="primary" type="submit" disabled={isSubmittingLead} className="submitBtn">
                {isSubmittingLead && <span className="btnSpinner" aria-hidden="true" />}
                <span>{isSubmittingLead ? "Отправка..." : "Отправить"}</span>
              </Button>
            </div>

            {leadSubmitState.type !== "idle" && (
              <div className={`formMessage formMessage--${leadSubmitState.type}`} role="status" aria-live="polite">
                {leadSubmitState.message}
              </div>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}
