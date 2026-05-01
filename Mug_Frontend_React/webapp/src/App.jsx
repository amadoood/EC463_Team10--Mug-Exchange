import { useEffect, useMemo, useState } from "react";
import mugLogo from "./assets/mug.png";
import { cafes } from "./constants/data";
import { useOrderSocket } from "./hooks/useOrderSocket";
import { internalOrderRequest, loginRequest, logoutRequest, signupRequest, verifyRequest } from "./lib/api";
import { coffeeIdToItem } from "./lib/order";
import BottomNav from "./components/BottomNav";
import DashboardView from "./views/DashboardView";
import LoginView from "./views/LoginView";
import MapView from "./views/MapView";
import OrderView from "./views/OrderView";
import PastView from "./views/PastView";
import ProfileView from "./views/ProfileView";
import SignupView from "./views/SignupView";

// ── Demo data (used when logging in with username "demo") ────────────────────
const DEMO_ORDERS = [
  {
    id: "ord-1",
    item: "Iced Cappuccino",
    status: "READY_PICKUP",
    mug_id: "MUG-4821",
    order_time: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    merchant_id: "gsu-starbucks",
    cafe_name: "Starbucks @ GSU",
  },
  {
    id: "ord-2",
    item: "Cold Brew",
    status: "IN_PROGRESS",
    mug_id: "MUG-3304",
    order_time: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    merchant_id: "pavement",
    cafe_name: "Pavement Coffeehouse",
  },
  {
    id: "ord-3",
    item: "Espresso",
    status: "MUG_RETURNED",
    mug_id: "MUG-2201",
    order_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    merchant_id: "cfa",
    cafe_name: "CFA Café",
  },
  {
    id: "ord-4",
    item: "Pecan Crunch Oat Latte",
    status: "MUG_RETURNED",
    mug_id: "MUG-1190",
    order_time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    merchant_id: "tatte",
    cafe_name: "Tatte Bakery & Café",
  },
];

function App() {
  const [view, setView] = useState(() => {
    const t = sessionStorage.getItem("authToken");
    if (!t) return "login";
    return sessionStorage.getItem("view") || "dashboard";
  });
  const [user, setUser] = useState(() =>
    sessionStorage.getItem("authToken") === "demo-token" ? "demo" : null
  );
  const [userUuid, setUserUuid] = useState(() =>
    sessionStorage.getItem("authToken") === "demo-token" ? "demo-uuid" : null
  );
  const [token, setToken] = useState(() => sessionStorage.getItem("authToken") || "");
  const [userPhone, setUserPhone] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [orders, setOrders] = useState(() =>
    sessionStorage.getItem("authToken") === "demo-token" ? DEMO_ORDERS : []
  );
  const [initializing, setInitializing] = useState(() => {
    const t = sessionStorage.getItem("authToken");
    return !!t && t !== "demo-token";
  });

  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState(false);

  const [signupFirstName, setSignupFirstName] = useState("");
  const [signupLastName, setSignupLastName] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPhone, setSignupPhone] = useState("");

  const [mapQuery, setMapQuery] = useState("");
  const [preSelectedCafe, setPreSelectedCafe] = useState(null);
  const [preOrderItem, setPreOrderItem] = useState(null);
  const [pinnedCafeId, setPinnedCafeId] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const activeOrders = useMemo(
    () => orders
      .filter((o) => o.status !== "MUG_RETURNED")
      .sort((a, b) => {
        const aReady = a.status === "READY_PICKUP" ? 0 : 1;
        const bReady = b.status === "READY_PICKUP" ? 0 : 1;
        return aReady - bReady;
      }),
    [orders]
  );
  const returnedOrders = useMemo(
    () => orders.filter((o) => o.status === "MUG_RETURNED"),
    [orders]
  );

  const filteredCafes = useMemo(() => {
    if (pinnedCafeId) {
      const cafe = cafes.find((c) => c.id === pinnedCafeId);
      return cafe ? [cafe] : [];
    }
    const needle = mapQuery.trim().toLowerCase();
    return cafes.filter((c) =>
      `${c.name} ${c.area}`.toLowerCase().includes(needle)
    );
  }, [mapQuery, pinnedCafeId]);

  useEffect(() => {
    if (!toastMessage) return undefined;
    const timer = setTimeout(() => setToastMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    const savedToken = sessionStorage.getItem("authToken");
    if (!savedToken || savedToken === "demo-token") return;

    verifyRequest(savedToken)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        setUser(data.username);
        setUserUuid(data.user_id);
        setDisplayName(data.display_name || "");
        setOrders(data.orders || []);
      })
      .catch(() => {
        sessionStorage.removeItem("authToken");
        sessionStorage.removeItem("view");s
        setToken("");
        setView("login");
      })
      .finally(() => setInitializing(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useOrderSocket({ token, user, setOrders });

  function gotoView(nextView) {
    if (nextView === "logout" && user) {
      const currentToken = sessionStorage.getItem("authToken");
      if (currentToken) logoutRequest(currentToken).catch(() => {});
      setUser(null);
      setUserUuid(null);
      setOrders([]);
      setToken("");
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("userUuid");
      sessionStorage.removeItem("view");
      setView("login");
      return;
    }

    if (nextView !== "login" && nextView !== "signup" && !user) {
      setView("login");
      return;
    }

    sessionStorage.setItem("view", nextView);
    setView(nextView);
    window.scrollTo(0, 0);
  }

  async function handleLogin() {
    // ── Demo mode: works offline / without the real server ──────────────────
    if (loginUsername.toLowerCase() === "demo") {
      setLoginError(false);
      setUser("demo");
      setUserUuid("demo-uuid");
      setOrders(DEMO_ORDERS);
      setToken("demo-token");
      setView("dashboard");
      return;
    }

    // ── Real server login ────────────────────────────────────────────────────
    try {
      const res = await loginRequest(loginUsername, loginPassword);
      if (!res.ok) { setLoginError(true); return; }
      const data = await res.json();
      setLoginError(false);
      setUser(loginUsername);
      setUserUuid(data.user_id);
      setUserPhone(data.phone || "");
      setDisplayName(data.display_name || "");
      setOrders(data.orders || []);
      setToken(data.token);
      sessionStorage.setItem("authToken", data.token);
      sessionStorage.setItem("view", "dashboard");
      setView("dashboard");
    } catch (err) {
      console.error("Login Error:", err);
      setLoginError(true);
    }
  }

  async function handleSignup() {
    if (!(signupFirstName && signupLastName && signupUsername && signupPassword && signupPhone)) {
      alert("Please fill in all fields");
      return;
    }
    try {
      await signupRequest(signupUsername, signupPassword, signupPhone, `${signupFirstName} ${signupLastName}`);
      setView("login");
    } catch (err) {
      console.error("Signup error:", err);
    }
  }

  async function handleOrder(coffee, selectedCafe) {
    if (!userUuid) { console.error("[order] Missing user UUID"); return; }

    // Demo mode: skip the server entirely, just update local state
    if (userUuid === "demo-uuid") {
      const newOrder = {
        id: crypto.randomUUID(),
        item: coffee.label,
        status: "IN_PROGRESS",
        mug_id: null,
        order_time: new Date().toISOString(),
        cafe_name: selectedCafe?.name ?? "",
        merchant_id: selectedCafe?.id ?? "",
      };
      setOrders(prev => [newOrder, ...prev]);
      setView("dashboard");
      setToastMessage(`Order placed at ${selectedCafe?.name ?? "cafe"}!`);
      return true;
    }

    // Real server order
    const body = {
      merchant_id: selectedCafe ? selectedCafe.id : 1,
      cafe_name: selectedCafe ? selectedCafe.name : null,
      item: coffeeIdToItem(coffee.id),
      id: crypto.randomUUID(),
      time: new Date().toISOString(),
      uuid: userUuid,
      price: Number(coffee.price),
    };
    try {
      const res = await internalOrderRequest(body);
      if (!res.ok) {
        if (res.status === 404) return "no_mugs";
        console.error("[order] failed:", await res.text());
        return false;
      }
      const data = await res.json();
      const order_num = data.order_num ?? null;
      setOrders(prev => [{
        id: body.id,
        orderId: body.id,
        order_num,
        item: coffee.label,
        status: "IN_PROGRESS",
        mug_id: null,
        order_time: body.time,
        cafe_name: selectedCafe?.name ?? "",
        merchant_id: body.merchant_id,
      }, ...prev]);
      setView("dashboard");
      setToastMessage(`Order placed at ${selectedCafe?.name ?? "cafe"}!`);
      return { order_num };
    } catch (err) {
      console.error("[order] error:", err);
      return false;
    }
  }

  if (initializing) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100dvh" }}>
        <img src={mugLogo} alt="Mug" style={{ width: 64, opacity: 0.6 }} />
      </div>
    );
  }

  return (
    <>
      <div className="app">
        <LoginView
          visible={view === "login"}
          mugLogo={mugLogo}
          username={loginUsername}
          password={loginPassword}
          loginError={loginError}
          onUsernameChange={setLoginUsername}
          onPasswordChange={setLoginPassword}
          onLogin={handleLogin}
          onGotoSignup={() => gotoView("signup")}
        />

        <SignupView
          visible={view === "signup"}
          mugLogo={mugLogo}
          username={signupUsername}
          password={signupPassword}
          firstName={signupFirstName}
          lastName={signupLastName}
          phone={signupPhone}
          onFirstNameChange={setSignupFirstName}
          onLastNameChange={setSignupLastName}
          onUsernameChange={setSignupUsername}
          onPasswordChange={setSignupPassword}
          onPhoneChange={setSignupPhone}
          onSignup={handleSignup}
          onGotoLogin={() => gotoView("login")}
        />

        <DashboardView
          visible={view === "dashboard"}
          user={user}
          displayName={displayName}
          activeOrders={activeOrders}
          mugLogo={mugLogo}
          onGotoView={gotoView}
        />

        <OrderView
          visible={view === "order"}
          onOrder={handleOrder}
          preSelectedCafe={preSelectedCafe}
          onClearPreSelected={() => setPreSelectedCafe(null)}
          preOrderItem={preOrderItem}
          onClearPreOrderItem={() => setPreOrderItem(null)}
          user={user}
        />

        <MapView
          visible={view === "map"}
          mapQuery={mapQuery}
          filteredCafes={filteredCafes}
          mugLogo={mugLogo}
          onMapQueryChange={(value) => {
            setMapQuery(value);
            setPinnedCafeId(null);
          }}
          onPinClick={(id, label) => {
            setPinnedCafeId(id);
            setMapQuery(label);
          }}
          onOrderAtCafe={(cafe) => {
            setPreSelectedCafe(cafe);
            setView("order");
            window.scrollTo(0, 0);
          }}
        />

        <PastView
          visible={view === "past"}
          returnedOrders={returnedOrders}
          mugLogo={mugLogo}
          onReorder={(order) => {
            // find the cafe this order was placed at, pre-select it, then navigate
            const cafe = cafes.find(c => c.id === order.merchant_id) || cafes[0];
            setPreSelectedCafe(cafe);
            setPreOrderItem(order.item);
            setView("order");
          }}
        />

        <ProfileView
          visible={view === "profile"}
          user={user}
          displayName={displayName}
          userPhone={userPhone}
          orders={orders}
          onGotoView={gotoView}
        />

        <BottomNav
          view={view}
          onGotoView={gotoView}
          activeOrderCount={activeOrders.length}
          readyCount={activeOrders.filter(o => o.status === "READY_PICKUP").length}
          visible={!!user}
        />
      </div>

      <div
        className={`toast${toastMessage ? " toast-visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        <span className="toast-dot" />
        {toastMessage}
      </div>
    </>
  );
}

export default App;
