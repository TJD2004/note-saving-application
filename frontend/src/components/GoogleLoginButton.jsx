import React from "react";
import axios from "axios";
import { FaGoogle } from "react-icons/fa";
import { useGoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import { googlestate, isloadingSet } from "../store/slices/authSlice";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}`;

const GoogleLoginButton = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const checkGoogleAuthentication = async (googleUser) => {
    try {
      dispatch(isloadingSet(true));

      // Get Google user information
      const { data } = await axios.get(
        "https://www.googleapis.com/oauth2/v1/userinfo",
        {
          headers: {
            Authorization: `Bearer ${googleUser.access_token}`,
            Accept: "application/json",
          },
        }
      );

      console.log("Google User:", data);

      // Send Google access token to your backend
      const response = await axios.post(
        `${API_URL}/api/auth/google-login`,
        {
          accessToken: googleUser.access_token,
        }
      );

      dispatch(
        googlestate({
          user: response.data.user,
          token: response.data.token,
        })
      );

      navigate("/");
    } catch (error) {
      console.error(
        "Google Login Error:",
        error.response?.data || error.message
      );
    } finally {
      dispatch(isloadingSet(false));
    }
  };

  const loginUsingGoogle = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      console.log(tokenResponse);
      checkGoogleAuthentication(tokenResponse);
    },
    onError: (error) => {
      console.error("Google Login Failed:", error);
    },
  });

  return (
    <button
      onClick={() => loginUsingGoogle()}
      className="w-full flex items-center justify-center px-3 sm:px-4 py-2 sm:py-3 border border-gray-600 rounded-lg bg-white hover:bg-gray-50 text-gray-900 font-medium transition-all duration-200 transform hover:scale-105 text-sm sm:text-base"
    >
      <FaGoogle className="mr-2 sm:mr-3 text-red-500 text-sm sm:text-base" />
      Continue with Google
    </button>
  );
};

export default GoogleLoginButton;