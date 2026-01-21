import React from 'react';
import { ToastContainer } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import 'react-toastify/dist/ReactToastify.css';

const DynamicToastContainer: React.FC = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'he';

  return (
    <ToastContainer 
      position={isRTL ? "top-left" : "top-right"}
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={isRTL}
      pauseOnFocusLoss
      draggable
      pauseOnHover
    />
  );
};

export default DynamicToastContainer;
