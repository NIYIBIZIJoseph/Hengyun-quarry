"use client";
import { FaWhatsapp } from "react-icons/fa";

const WHATSAPP_NUMBER = "250786592766";
const WHATSAPP_MESSAGE = "Hello%20HENG%20YUN%2C%20I%20would%20like%20to%20inquire%20about%20your%20products.";

export default function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-float"
      aria-label="Chat on WhatsApp"
    >
      <FaWhatsapp />
      <style>{`
        .whatsapp-float {
          position: fixed;
          bottom: 80px;
          right: 20px;
          background: #25D366;
          color: white;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
          box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);
          z-index: 9998;
          text-decoration: none;
          transition: all 0.3s ease;
        }
        .whatsapp-float:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(37, 211, 102, 0.4);
        }
      `}</style>
    </a>
  );
}
