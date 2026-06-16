import './index.css'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Features from './components/Features'
import HowItWorks from './components/HowItWorks'
import Shortcuts from './components/Shortcuts'
import Faq from './components/Faq'
import Download from './components/Download'
import Footer from './components/Footer'

function App() {
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

export default App
