import Sidebar from "./components/Sidebar/Sidebar";
import { DEFAULT_PAGE, findItem } from "./config/navigation";
import { useHashRoute } from "./useHashRoute";
import Overview from "./views/Overview";
import PagePreview from "./views/PagePreview";
import "./App.css";

const App: React.FC = () => {
  const [page, navigate] = useHashRoute();
  const item = findItem(page) ?? findItem(DEFAULT_PAGE)!;

  return (
    <div className="app">
      <Sidebar current={item.id} onSelect={navigate} />
      <main className="app__main">
        {item.id === "overview" ? <Overview onSelect={navigate} /> : <PagePreview item={item} />}
      </main>
    </div>
  );
};

export default App;
