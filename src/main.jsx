import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  Check,
  Clock3,
  Flame,
  Globe2,
  Heart,
  MapPin,
  Menu,
  Minus,
  Moon,
  Phone,
  Plus,
  Search,
  ShoppingBag,
  Star,
  Sun,
  Trash2,
  Truck,
  Utensils,
  X
} from "lucide-react";
import "./styles.css";
import { translations, items, categoryLabels, itemTranslations, menuGroups } from "./content.js";


function localizeItems(language) {
  return items.map((item) => ({
    ...item,
    categoryLabel: categoryLabels[language][item.category],
    ...itemTranslations[language][item.id]
  }));
}

function SafeImage({ src, alt }) {
  const fallback = "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=85";
  return (
    <img
      src={src || fallback}
      alt={alt}
      onError={(e) => {
        if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
      }}
    />
  );
}

function App() {
  const [lang, setLang] = useState(localStorage.getItem("ember-lang") || "en");
  const [dark, setDark] = useState(localStorage.getItem("ember-theme") === "dark");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Popular");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem("ember-favorites") || "[]"));
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem("ember-cart") || "[]"));
  const [drawer, setDrawer] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderType, setOrderType] = useState("delivery");
  const [payment, setPayment] = useState("card");
  const [toast, setToast] = useState("");
  const t = translations[lang];
  const localizedItems = useMemo(() => localizeItems(lang), [lang]);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("ember-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    document.documentElement.lang = lang === "uk" ? "uk" : lang;
    localStorage.setItem("ember-lang", lang);
  }, [lang]);

  useEffect(() => localStorage.setItem("ember-favorites", JSON.stringify(favorites)), [favorites]);
  useEffect(() => localStorage.setItem("ember-cart", JSON.stringify(cart)), [cart]);

  useEffect(() => {
    const selectedGroup = menuGroups.find((group) => group.category === activeCategory);
    if (orderType === "delivery" && selectedGroup?.type === "drink") {
      setActiveCategory("Popular");
    }
  }, [orderType, activeCategory]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(id);
  }, [toast]);

  const visibleItems = useMemo(() => {
    return localizedItems.filter((item) => {
      if (orderType === "delivery" && item.type === "drink") return false;

      const categoryMatch =
        activeCategory === "Popular"
          ? item.popular
          : item.category === activeCategory;

      const queryText = `${item.name} ${item.description} ${item.categoryLabel} ${item.ingredients.join(" ")}`.toLowerCase();
      const queryMatch = queryText.includes(query.toLowerCase());

      const filterMatch =
        filter === "All" ||
        (filter === "Popular" && item.popular) ||
        (filter === "Vegetarian" && item.vegetarian) ||
        (filter === "Spicy" && item.spicy) ||
        (filter === "Under $20" && item.price < 20);

      return categoryMatch && queryMatch && filterMatch;
    });
  }, [activeCategory, query, filter, localizedItems, orderType]);

  const cartItems = cart
    .map((entry) => ({ ...localizedItems.find((item) => item.id === entry.id), qty: entry.qty }))
    .filter((item) => item.id && !(orderType === "delivery" && item.type === "drink"));

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const deliveryFee = orderType === "delivery" && subtotal > 0 ? 4 : 0;
  const total = subtotal + deliveryFee;

  const addToCart = (id, qty = 1) => {
    const selected = localizedItems.find((item) => item.id === id);
    if (orderType === "delivery" && selected?.type === "drink") return;

    setCart((current) => {
      const found = current.find((item) => item.id === id);
      return found
        ? current.map((item) => item.id === id ? { ...item, qty: item.qty + qty } : item)
        : [...current, { id, qty }];
    });
    setToast(t.added);
  };

  const changeQty = (id, delta) => {
    setCart((current) =>
      current
        .map((item) => item.id === id ? { ...item, qty: item.qty + delta } : item)
        .filter((item) => item.qty > 0)
    );
  };

  const toggleFavorite = (id) => {
    setFavorites((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenu(false);
  };

  return (
    <>
      <header className="topbar">
        <button className="brand" onClick={() => scrollTo("app")}>
          <span>E</span>
          <b>EMBER TABLE</b>
        </button>

        <nav className={mobileMenu ? "open" : ""}>
          {t.nav.map((label, index) => (
            <button
              key={label}
              onClick={() => scrollTo(["menu", "restaurant-info", "about"][index])}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="header-actions">
          <label>
            <Globe2 size={16} />
            <select value={lang} onChange={(e) => setLang(e.target.value)}>
              <option value="en">EN</option>
              <option value="pl">PL</option>
              <option value="uk">UA</option>
            </select>
          </label>

          <button onClick={() => setDark((value) => !value)} aria-label="Theme">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button onClick={() => setDrawer("favorites")} className="count-button">
            <Heart size={18} />
            <span>{favorites.length}</span>
          </button>

          <button onClick={() => setDrawer("cart")} className="count-button">
            <ShoppingBag size={18} />
            <span>{cart.reduce((sum, item) => sum + item.qty, 0)}</span>
          </button>

          <button
            className="mobile-menu"
            onClick={() => setMobileMenu((value) => !value)}
          >
            {mobileMenu ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <main id="app" className="app-shell">
        <aside className="sidebar">
          <button
            className={activeCategory === "Popular" ? "active popular-link" : "popular-link"}
            onClick={() => setActiveCategory("Popular")}
          >
            <Star size={18} />
            {t.popular}
          </button>

          <section>
            <span>{t.food}</span>
            {menuGroups.filter((group) => group.type === "food").map(({ category, icon: Icon }) => (
              <button
                className={activeCategory === category ? "active" : ""}
                key={category}
                onClick={() => setActiveCategory(category)}
              >
                <Icon size={17} />
                {categoryLabels[lang][category]}
              </button>
            ))}
          </section>

          {orderType !== "delivery" && (
            <section>
              <span>{t.drinks}</span>
              {menuGroups.filter((group) => group.type === "drink").map(({ category, icon: Icon }) => (
                <button
                  className={activeCategory === category ? "active" : ""}
                  key={category}
                  onClick={() => setActiveCategory(category)}
                >
                  <Icon size={17} />
                  {categoryLabels[lang][category]}
                </button>
              ))}
            </section>
          )}
        </aside>

        <section className="menu-column" id="menu">
          <div className="menu-top">
            <div>
              <span className="kicker">EMBER TABLE</span>
              <h1>{categoryLabels[lang][activeCategory]}</h1>
              <p>
                {activeCategory === "Breakfast"
                  ? t.breakfastHours
                  : t.freshToday}
              </p>
            </div>

            <div className="search-box">
              <Search size={19} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={orderType === "delivery" ? t.searchDelivery : t.search} />
            </div>
          </div>

          <div className="filter-row">
            {["All", "Popular", "Vegetarian", "Spicy", "Under $20"].map((name, index) => (
              <button
                key={name}
                className={filter === name ? "active" : ""}
                onClick={() => setFilter(name)}
              >
                {t.filters[index]}
              </button>
            ))}
          </div>

          <div className="offer-strip">
            <div>
              <span>{t.seasonal}</span>
              <strong>{t.offerTitle}</strong>
              <small>{t.offerText}</small>
            </div>
            <button onClick={() => setActiveCategory("Main Course")}>
              {t.seeOffer}
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="menu-list">
            {visibleItems.length ? (
              visibleItems.map((item) => (
                <article className="menu-item" key={item.id}>
                  <div className="menu-item-copy">
                    <div className="menu-item-head">
                      <div>
                        <h2>{item.name}</h2>
                        <strong>${item.price}</strong>
                      </div>

                      <button
                        className={favorites.includes(item.id) ? "favorite active" : "favorite"}
                        onClick={() => toggleFavorite(item.id)}
                        aria-label="Favorite"
                      >
                        <Heart size={18} />
                      </button>
                    </div>

                    <p>{item.description}</p>

                    <div className="item-tags">
                      <span><Star size={14} /> {item.rating}</span>
                      <span>{item.weight}</span>
                      <span><Clock3 size={14} /> {item.prep} min</span>
                      {item.spicy && <span className="spicy"><Flame size={14} /> {t.spicyLabel}</span>}
                    </div>

                    <div className="item-actions">
                      <button className="details-button" onClick={() => setSelectedItem(item)}>
                        {t.details}
                      </button>
                      <button className="add-button" onClick={() => addToCart(item.id)}>
                        {t.add}
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  <button className="menu-item-image" onClick={() => setSelectedItem(item)}>
                    <SafeImage src={item.image} alt={item.name} />
                  </button>
                </article>
              ))
            ) : (
              <div className="no-results">
                <Search size={36} />
                <p>{t.noResults}</p>
              </div>
            )}
          </div>
        </section>

        <aside className="info-panel" id="restaurant-info">
          <div className="info-search">
            <Search size={18} />
            <span>{t.search}</span>
          </div>

          <h3>{t.infoTitle}</h3>

          <div className="info-row">
            <Clock3 />
            <div>
              <span>{t.open}</span>
              <strong>10:00–23:00</strong>
            </div>
          </div>

          <div className="info-row">
            <MapPin />
            <div>
              <span>{t.address}</span>
              <strong>Nowy Świat 18, Warsaw</strong>
            </div>
          </div>

          <div className="info-row">
            <Phone />
            <div>
              <span>{t.phone}</span>
              <strong>+48 509 334 229</strong>
            </div>
          </div>

          <div className="delivery-card">
            <Truck />
            <div>
              <strong>{t.delivery}</strong>
              <span>{t.eta}</span>
              <small>{t.minOrder}: $15</small>
              <small>{t.freeDelivery}</small>
            </div>
          </div>

          <div className="service-options">
            <button className={orderType === "delivery" ? "active" : ""} onClick={() => setOrderType("delivery")}>{t.delivery}</button>
            <button className={orderType === "pickup" ? "active" : ""} onClick={() => setOrderType("pickup")}>{t.pickup}</button>
            <button className={orderType === "dinein" ? "active" : ""} onClick={() => setOrderType("dinein")}>{t.dinein}</button>
          </div>
          {orderType === "delivery" && (
            <p className="availability-note">{t.drinksUnavailableDelivery}</p>
          )}

          <div className="restaurant-mini" id="about">
            <SafeImage
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c5?auto=format&fit=crop&w=900&q=85"
              alt="Restaurant interior"
            />
            <div>
              <strong>Ember Table</strong>
              <span>{t.restaurantSummary}</span>
            </div>
          </div>
        </aside>
      </main>

      <nav className="mobile-bottom-nav">
        <button onClick={() => setActiveCategory("Popular")}><Star size={19} /><span>{t.popular}</span></button>
        <button onClick={() => scrollTo("menu")}><Utensils size={19} /><span>{t.nav[0]}</span></button>
        <button onClick={() => setDrawer("favorites")}><Heart size={19} /><span>{t.favorites}</span></button>
        <button onClick={() => setDrawer("cart")}><ShoppingBag size={19} /><span>{t.cart}</span></button>
      </nav>

      {selectedItem && (
        <div className="modal-backdrop" onMouseDown={() => setSelectedItem(null)}>
          <div className="product-modal" onMouseDown={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedItem(null)}>
              <X />
            </button>

            <SafeImage src={selectedItem.image} alt={selectedItem.name} />

            <div className="product-content">
              <span>{categoryLabels[lang][selectedItem.category]}</span>
              <h2>{selectedItem.name}</h2>
              <p>{selectedItem.description}</p>

              <div className="product-stats">
                <div><small>{t.calories}</small><strong>{selectedItem.calories} kcal</strong></div>
                <div><small>{t.preparation}</small><strong>{selectedItem.prep} min</strong></div>
                <div><small>{t.rating}</small><strong>{selectedItem.rating} ★</strong></div>
              </div>

              <h4>{t.ingredients}</h4>
              <p>{selectedItem.ingredients.join(", ")}</p>

              <h4>{t.allergens}</h4>
              <p>{selectedItem.allergens.length ? selectedItem.allergens.join(", ") : "—"}</p>

              <button
                className="primary-button"
                onClick={() => {
                  addToCart(selectedItem.id);
                  setSelectedItem(null);
                  setDrawer("cart");
                }}
              >
                {t.add}
                <ShoppingBag size={17} />
              </button>
            </div>
          </div>
        </div>
      )}

      {drawer && (
        <div className="drawer-backdrop" onMouseDown={() => setDrawer(null)}>
          <aside className="drawer" onMouseDown={(e) => e.stopPropagation()}>
            <div className="drawer-head">
              <h2>{drawer === "favorites" ? t.favorites : t.cart}</h2>
              <button onClick={() => setDrawer(null)}><X /></button>
            </div>

            {drawer === "favorites" ? (
              favorites.length ? (
                localizedItems
                  .filter((item) => favorites.includes(item.id))
                  .filter((item) => !(orderType === "delivery" && item.type === "drink"))
                  .map((item) => (
                  <article className="drawer-item" key={item.id}>
                    <SafeImage src={item.image} alt={item.name} />
                    <div>
                      <strong>{item.name}</strong>
                      <span>${item.price}</span>
                    </div>
                    <button onClick={() => toggleFavorite(item.id)}><Trash2 size={17} /></button>
                  </article>
                ))
              ) : (
                <div className="empty-state"><Heart /><p>{t.emptyFavorites}</p></div>
              )
            ) : (
              cartItems.length ? (
                <>
                  <div className="service-options drawer-services">
                    <button className={orderType === "delivery" ? "active" : ""} onClick={() => setOrderType("delivery")}>{t.delivery}</button>
                    <button className={orderType === "pickup" ? "active" : ""} onClick={() => setOrderType("pickup")}>{t.pickup}</button>
                    <button className={orderType === "dinein" ? "active" : ""} onClick={() => setOrderType("dinein")}>{t.dinein}</button>
                  </div>

                  {cartItems.map((item) => (
                    <article className="cart-item" key={item.id}>
                      <SafeImage src={item.image} alt={item.name} />
                      <div>
                        <strong>{item.name}</strong>
                        <span>${item.price}</span>
                        <div className="quantity-control">
                          <button onClick={() => changeQty(item.id, -1)}><Minus size={15} /></button>
                          <b>{item.qty}</b>
                          <button onClick={() => changeQty(item.id, 1)}><Plus size={15} /></button>
                        </div>
                      </div>
                    </article>
                  ))}

                  <div className="cart-summary">
                    <div><span>{t.subtotal}</span><strong>${subtotal}</strong></div>
                    <div><span>{t.fee}</span><strong>${deliveryFee}</strong></div>
                    <div className="summary-total"><span>{t.total}</span><strong>${total}</strong></div>
                  </div>

                  <button
                    className="primary-button full"
                    onClick={() => {
                      setDrawer(null);
                      setCheckoutOpen(true);
                    }}
                  >
                    {t.checkout}
                    <ArrowRight size={17} />
                  </button>
                </>
              ) : (
                <div className="empty-state"><ShoppingBag /><p>{t.emptyCart}</p></div>
              )
            )}
          </aside>
        </div>
      )}

      {checkoutOpen && (
        <div className="modal-backdrop" onMouseDown={() => setCheckoutOpen(false)}>
          <form
            className="checkout-modal"
            onMouseDown={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              setCart([]);
              setCheckoutOpen(false);
              setToast(t.orderSuccess);
            }}
          >
            <button type="button" className="modal-close" onClick={() => setCheckoutOpen(false)}>
              <X />
            </button>

            <span className="checkout-kicker">EMBER TABLE</span>
            <h2>{t.orderTitle}</h2>

            <div className="service-options checkout-services">
              <button type="button" className={orderType === "delivery" ? "active" : ""} onClick={() => setOrderType("delivery")}>{t.delivery}</button>
              <button type="button" className={orderType === "pickup" ? "active" : ""} onClick={() => setOrderType("pickup")}>{t.pickup}</button>
              <button type="button" className={orderType === "dinein" ? "active" : ""} onClick={() => setOrderType("dinein")}>{t.dinein}</button>
            </div>

            <div className="form-grid">
              <label>
                {t.customerName}
                <input required name="name" autoComplete="name" />
              </label>

              <label>
                {t.customerPhone}
                <input required name="phone" type="tel" autoComplete="tel" />
              </label>

              <label className="full-field">
                {t.customerEmail}
                <input required name="email" type="email" autoComplete="email" />
              </label>

              {orderType === "delivery" && (
                <>
                  <label className="full-field">
                    {t.deliveryAddress}
                    <input required name="address" autoComplete="street-address" />
                  </label>

                  <label>
                    {t.apartment}
                    <input name="apartment" />
                  </label>

                  <label>
                    {t.city}
                    <input required name="city" defaultValue="Warsaw" />
                  </label>

                  <label>
                    {t.postalCode}
                    <input required name="postal" />
                  </label>

                  <label className="full-field">
                    {t.deliveryNotes}
                    <textarea name="notes" rows="3" />
                  </label>
                </>
              )}

              {orderType === "pickup" && (
                <div className="pickup-info full-field">
                  <MapPin />
                  <div>
                    <strong>Nowy Świat 18, Warsaw</strong>
                    <span>{t.pickupReady}</span>
                  </div>
                </div>
              )}

              {orderType === "dinein" && (
                <label className="full-field">
                  {t.tableNumber}
                  <input required name="table" />
                </label>
              )}
            </div>

            <div className="payment-section">
              <span>{t.payment}</span>
              <div className="payment-options">
                <button type="button" className={payment === "card" ? "active" : ""} onClick={() => setPayment("card")}>{t.card}</button>
                <button type="button" className={payment === "cash" ? "active" : ""} onClick={() => setPayment("cash")}>{t.cash}</button>
              </div>
            </div>

            <div className="checkout-total">
              <span>{t.total}</span>
              <strong>${total}</strong>
            </div>

            <button className="primary-button full" type="submit">
              {t.placeOrder}
              <Check size={17} />
            </button>
          </form>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
