import Account from './pages/Account';
import Analytics from './pages/Analytics';
import Application from './pages/Application';
import Captures from './pages/Captures';
import Challenges from './pages/Challenges';
import CircleChat from './pages/CircleChat';
import Circles from './pages/Circles';
import Coaching from './pages/Coaching';
import Dashboard from './pages/Dashboard';
import DropSignal from './pages/DropSignal';
import Feed from './pages/Feed';
import Friends from './pages/Friends';
import Goals from './pages/Goals';
import Onboarding from './pages/Onboarding';
import SignalDetail from './pages/SignalDetail';
import Transmission from './pages/Transmission';
import Vault from './pages/Vault';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Account": Account,
    "Analytics": Analytics,
    "Application": Application,
    "Captures": Captures,
    "Challenges": Challenges,
    "CircleChat": CircleChat,
    "Circles": Circles,
    "Coaching": Coaching,
    "Dashboard": Dashboard,
    "DropSignal": DropSignal,
    "Feed": Feed,
    "Friends": Friends,
    "Goals": Goals,
    "Onboarding": Onboarding,
    "SignalDetail": SignalDetail,
    "Transmission": Transmission,
    "Vault": Vault,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};