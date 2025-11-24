
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const Login: React.FC = () => {
  const { login, loginWithGoogle, resetPassword, loginWithEmail, registerWithEmail } = useUser();
  const navigate = useNavigate();
  const [loginMode, setLoginMode] = useState<'nickname' | 'email'>('nickname');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      if (loginMode === 'nickname') {
        if (!nickname) {
          alert("请输入您的微信昵称");
          setIsLoggingIn(false);
          return;
        }
        if (!password) {
          alert("请输入密码");
          setIsLoggingIn(false);
          return;
        }
        await login(nickname, password);
      } else {
        if (!email) {
          alert("请输入您的邮箱");
          setIsLoggingIn(false);
          return;
        }
        if (!password) {
          alert("请输入密码");
          setIsLoggingIn(false);
          return;
        }
        // Email Mode: Try Login first, if fails with "user-not-found", ask to Register
        try {
          await loginWithEmail(email, password);
        } catch (error: any) {
          if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
            // Ask user if they want to register
            const doRegister = confirm("未找到该邮箱账号，是否要立即注册？");
            if (doRegister) {
              let nameToRegister = nickname;
              if (!nameToRegister) {
                const name = prompt("请输入您的微信昵称用于注册：");
                if (!name) throw new Error("必须输入昵称才能注册");
                nameToRegister = name;
              }
              await registerWithEmail(email, password, nameToRegister);
            } else {
              throw error;
            }
          } else {
            throw error;
          }
        }
      }
      navigate('/');
    } catch (error: any) {
      console.error("Login failed", error);
      alert(error.message || "登录失败");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          闲鱼副业搞钱助手
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          内部推广素材库 & 专属海报生成
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">

          {/* Login Mode Toggle */}
          <div className="flex justify-center mb-6 border-b border-gray-200 pb-4">
            <button
              className={`px - 4 py - 2 text - sm font - medium ${loginMode === 'nickname' ? 'text-xianyu-yellow border-b-2 border-xianyu-yellow' : 'text-gray-500 hover:text-gray-700'} `}
              onClick={() => setLoginMode('nickname')}
              disabled={isLoggingIn}
            >
              微信昵称登录
            </button>
            <button
              className={`px - 4 py - 2 text - sm font - medium ${loginMode === 'email' ? 'text-xianyu-yellow border-b-2 border-xianyu-yellow' : 'text-gray-500 hover:text-gray-700'} `}
              onClick={() => setLoginMode('email')}
              disabled={isLoggingIn}
            >
              邮箱账号登录
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>

            {loginMode === 'nickname' && (
              <div>
                <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">
                  微信昵称
                </label>
                <div className="mt-1">
                  <input
                    id="nickname"
                    name="nickname"
                    type="text"
                    required
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-xianyu-yellow focus:border-xianyu-yellow sm:text-sm"
                    placeholder="请输入您的微信昵称"
                    disabled={isLoggingIn}
                  />
                </div>
              </div>
            )}

            {loginMode === 'email' && (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    电子邮箱
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-xianyu-yellow focus:border-xianyu-yellow sm:text-sm"
                      placeholder="请输入您的邮箱"
                      disabled={isLoggingIn}
                    />
                  </div>
                </div>
                {/* Optional Nickname for registration context, but we handle it in prompt or separate field if we wanted */}
              </>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                登录密码
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-xianyu-yellow focus:border-xianyu-yellow sm:text-sm"
                  placeholder="设置或输入您的登录密码"
                  disabled={isLoggingIn}
                />
              </div>
            </div>
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  const choice = confirm("如果您是使用「邮箱/Google」注册，点击【确定】输入邮箱重置密码。\n\n如果您是使用「微信昵称」注册且未绑定邮箱，请联系管理员重置密码。\n\n点击【取消】关闭。");
                  if (choice) {
                    const email = prompt("请输入您的注册邮箱:");
                    if (email) resetPassword(email);
                  }
                }}
                className="text-xs text-blue-600 hover:text-blue-500"
              >
                忘记密码?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-black bg-xianyu-yellow hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-xianyu-yellow disabled:opacity-50"
            >
              {isLoggingIn ? '登录中...' : '立即登录 / 注册'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">或者</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => loginWithGoogle()}
              disabled={isLoggingIn}
              className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-xianyu-yellow disabled:opacity-50"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              使用 Google 登录
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  提示
                </span>
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-gray-500">
              <p>
                首次登录默认为「免费推广者」。<br />如需查看选品库，请联系管理员升级为「星球会员」。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
