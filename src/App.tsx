import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SearchPage from "./pages/SearchPage";
import SignupAgentWizardPage from "./pages/SignupAgentWizardPage";
import SignupPage from "./pages/SignupPage";
import SignupWizardPage from "./pages/SignupWizardPage";

/**
 * 애플리케이션의 루트 컴포넌트입니다.
 * 라우팅 설정을 포함하여 홈, 로그인, 검색, 회원가입 페이지로의 경로를 정의합니다.
 *
 * @returns 라우팅이 설정된 애플리케이션 컴포넌트
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/signup/user" element={<SignupWizardPage />} />
        <Route path="/signup/realtor" element={<SignupAgentWizardPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
