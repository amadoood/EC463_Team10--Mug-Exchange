import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { SERVER_URL } from "../constants/data";
import { orderKey } from "../lib/order";

export function useOrderSocket({ token, user, setOrders }) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token || !user) return;

    try {
      socketRef.current = io(SERVER_URL, {
        transports: ["websocket"],
        auth: { token },
      });

      socketRef.current.on("orderUpdate", (updatedData) => {
        setOrders((prev) => {
          const key = orderKey(updatedData);
          if (key != null) {
            const idx = prev.findIndex((o) => orderKey(o) === key);
            if (idx !== -1) {
              const next = [...prev];
              next[idx] = { ...prev[idx], ...updatedData };
              return next;
            }
          }
          return [updatedData, ...prev];
        });
      });
    } catch (err) {
      console.error("[socket] error:", err);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token, user, setOrders]);
}
