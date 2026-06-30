import './index.css'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Features from './components/Features'
import HowItWorks from './components/HowItWorks'
import Shortcuts from './components/Shortcuts'
import Faq from './components/Faq'
import Download from './components/Download'
import Footer from './components/Footer'

import Experiment from './components/Experiment'
function App() {
  const path = window.location.pathname

  const renderContent = () => {
    switch (path) {
      case '/experiment':
        return <Experiment />
      default:
        return (
          <>
            <Navbar />
            <main>
              <Hero />
              <Features />
              <HowItWorks />
              <Shortcuts />
              <Faq />
              <Download />
            </main>
            <Footer />
          </>
        )
    }
  }

  return (
    <>
      {renderContent()}
    </>
  )
}

export default App

