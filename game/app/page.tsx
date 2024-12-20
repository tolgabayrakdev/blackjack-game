'use client'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, createDeck, calculateHandValue } from '../utils/deck'

export default function Home() {
  const [deck, setDeck] = useState<Card[]>([])
  const [playerCards, setPlayerCards] = useState<Card[]>([])
  const [dealerCards, setDealerCards] = useState<Card[]>([])
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'finished'>('waiting')
  const [message, setMessage] = useState<string>('')
  const [balance, setBalance] = useState<number>(500)
  const [currentBet, setCurrentBet] = useState<number>(0)
  const [isBetting, setIsBetting] = useState<boolean>(true)
  const [isDealing, setIsDealing] = useState(false)
  const [justDrawnCard, setJustDrawnCard] = useState<number | null>(null)
  const [lastBet, setLastBet] = useState<number>(0) // Son bahis miktarını takip etmek için
  const [showAgeWarning, setShowAgeWarning] = useState(false)
  const [ageConfirmed, setAgeConfirmed] = useState(false)
  const [playerName, setPlayerName] = useState<string>('')
  const [showNamePrompt, setShowNamePrompt] = useState(true)

  const betOptions = [50, 100, 200, 500]

  // useEffect ile localStorage kontrolü ve güncelleme yapalım
  useEffect(() => {
    // Sayfa yüklendiğinde localStorage'dan bakiyeyi al
    const savedBalance = localStorage.getItem('blackjackBalance')
    if (savedBalance) {
      setBalance(parseInt(savedBalance))
    }
  }, []) // Sadece bir kere çalışsın

  // Bakiye değiştiğinde localStorage'ı güncelle
  useEffect(() => {
    localStorage.setItem('blackjackBalance', balance.toString())
  }, [balance])

  // resetBalance fonksiyonunu güncelleyelim
  const resetBalance = () => {
    const newBalance = 500
    setBalance(newBalance)
    localStorage.setItem('blackjackBalance', newBalance.toString())
    window.location.reload()
  }

  // Bahis yap
  const placeBet = (amount: number) => {
    // Aktif bir bahis varsa veya oyun devam ediyorsa yeni bahis alınmasın
    if (currentBet > 0 || gameStatus === 'playing') {
      return;
    }

    // Bahis miktarı bakiyeden büyükse bahis alınmasın
    if (amount > balance) {
      return;
    }
    
    setCurrentBet(amount)
    if (!playerName) {
      setShowNamePrompt(true)
    } else if (!ageConfirmed) {
      setShowAgeWarning(true)
    } else {
      startBetWithAmount(amount)
    }
  }

  // Yaş onayından sonra bahisi başlat
  const startBetWithAmount = (amount: number) => {
    setCurrentBet(amount)
    setLastBet(amount)
    setBalance(balance - amount)
    setIsBetting(false)
    startNewGame()
  }

  // Yaş onayı fonksiyonu
  const confirmAge = () => {
    setAgeConfirmed(true)
    setShowAgeWarning(false)
    // Eğer bekleyen bir bahis varsa, oyunu başlat
    if (currentBet > 0) {
      startBetWithAmount(currentBet)
    }
  }

  // İsim onayı fonksiyonu
  const confirmName = (name: string) => {
    setPlayerName(name)
    setShowNamePrompt(false)
    localStorage.setItem('blackjackPlayerName', name)
    
    // İsim onaylandıktan sonra yaş kontrolü yap
    if (currentBet > 0) {
      if (!ageConfirmed) {
        setShowAgeWarning(true)
      } else {
        startBetWithAmount(currentBet)
      }
    }
  }

  // Yeni oyun başlat
  const startNewGame = async () => {
    setIsDealing(true)
    const newDeck = createDeck()
    setDeck(newDeck)
    
    setPlayerCards([])
    setDealerCards([])
    
    // İlk oyuncu kartları
    await new Promise(resolve => setTimeout(resolve, 500))
    const initialPlayerCards = [newDeck[0], newDeck[1]]
    setPlayerCards(initialPlayerCards)
    
    // Dealer kartı
    await new Promise(resolve => setTimeout(resolve, 500))
    const initialDealerCards = [newDeck[2]]
    setDealerCards(initialDealerCards)
    
    setDeck(newDeck.slice(3))
    setGameStatus('playing')
    setMessage('')
    setIsDealing(false)

    // İlk dağıtımda Blackjack kontrolü
    const playerTotal = calculateHandValue(initialPlayerCards)
    if (playerTotal === 21) {
      setGameStatus('finished')
      setMessage('🎰 BLACKJACK! Muhteşem bir el kazandınız! 🎰')
      const blackjackPayout = currentBet * 2.5
      setBalance(balance + Math.floor(blackjackPayout))
      setTimeout(() => {
        setMessage('')
        resetGame()
      }, 2500)
      return
    }
  }

  // Oyunu sıfırla
  const resetGame = () => {
    setPlayerCards([])
    setDealerCards([])
    setGameStatus('waiting')
    setCurrentBet(0)
    
    // Bakiye kontrolünü kaldıralım ve yerine bahis kontrolü ekleyelim
    // Eğer son bahis bakiyeden küçük veya eşitse bahis ekranını göster
    if (lastBet <= balance) {
      setIsBetting(true)
    } else {
      // Eğer bakiye son bahisten küçükse ama hala para varsa bahis ekranını göster
      if (balance > 0) {
        setIsBetting(true)
      }
      // Eğer bakiye 0 ise ve oyun bittiyse para bittiği modalı gösterilecek
    }
  }

  // Yeni el başlat butonu için fonksiyon
  const startNewHand = () => {
    if (lastBet > balance) {
      setIsBetting(true) // Yeterli bakiye yoksa bahis ekranına yönlendir
    } else {
      placeBet(lastBet)
    }
  }

  // Kart çek
  const hit = async () => {
    if (deck.length === 0) return
    
    const newCard = deck[0]
    setJustDrawnCard(playerCards.length)
    setPlayerCards(prev => [...prev, newCard])
    setDeck(deck.slice(1))

    await new Promise(resolve => setTimeout(resolve, 300))
    setJustDrawnCard(null)

    const newPlayerCards = [...playerCards, newCard]
    const playerTotal = calculateHandValue(newPlayerCards)
    
    // 21 kontrolü - direkt kazanma
    if (playerTotal === 21) {
      setGameStatus('finished')
      setMessage('🎰 21! Mükemmel bir el! 🎰')
      setBalance(balance + (currentBet * 2))
      setTimeout(() => {
        setMessage('')
        resetGame()
      }, 2000)
      return
    }
    
    if (playerTotal > 21) {
      setGameStatus('finished')
      setMessage('💥 Kaybettiniz! 21\'i geçtiniz.')
      setTimeout(() => {
        setMessage('')
        resetGame()
      }, 2000)
    }
  }

  // Dur
  const stand = async () => {
    let currentDealerCards = [...dealerCards]
    let currentDeck = [...deck]
    
    // Dealer'ın kartlarını göster ve her kart için 21 kontrolü yap
    while (calculateHandValue(currentDealerCards) < 17 && currentDeck.length > 0) {
      const newCard = currentDeck[0]
      currentDealerCards.push(newCard)
      currentDeck = currentDeck.slice(1)
      
      await new Promise(resolve => setTimeout(resolve, 500))
      setDealerCards([...currentDealerCards])
      
      // Dealer 21 yaptıysa hemen bitir
      const dealerTotal = calculateHandValue(currentDealerCards)
      if (dealerTotal === 21) {
        setGameStatus('finished')
        setMessage('😮 Dealer 21 yaptı!')
        setTimeout(() => {
          setMessage('')
          resetGame()
        }, 2000)
        return
      }
    }

    setDeck(currentDeck)

    const playerTotal = calculateHandValue(playerCards)
    const dealerTotal = calculateHandValue(currentDealerCards)

    setGameStatus('finished')
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Blackjack kontrolü ve özel mesajlar
    if (playerTotal === 21 && playerCards.length === 2) {
      setMessage('🎰 BLACKJACK! Muhteşem bir el kazandınız! 🎰')
      // Blackjack 3:2 oranında ödeme
      const blackjackPayout = currentBet * 2.5
      setBalance(balance + Math.floor(blackjackPayout))
    } else if (dealerTotal === 21 && currentDealerCards.length === 2) {
      setMessage('😮 Dealer Blackjack yaptı!')
    } else if (dealerTotal > 21) {
      setMessage('🎉 Kazandınız! Dealer 21\'i geçti.')
      setBalance(balance + (currentBet * 2))
    } else if (playerTotal > dealerTotal) {
      setMessage('🎉 Kazandınız!')
      setBalance(balance + (currentBet * 2))
    } else if (playerTotal < dealerTotal) {
      setMessage('😢 Kaybettiniz!')
    } else {
      setMessage('🤝 Berabere! Bahsiniz iade edildi.')
      setBalance(balance + currentBet)
    }

    // 2 saniye sonra mesajı temizle ve oyunu sıfırla
    setTimeout(() => {
      setMessage('')
      resetGame()
    }, 2500)
  }

  // Kart animasyon varyantları
  const cardVariants = {
    initial: {
      x: -1000,
      y: -1000,
      rotate: -180,
      opacity: 0
    },
    dealing: (index: number) => ({
      x: 0,
      y: 0,
      rotate: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
        delay: index * 0.2
      }
    }),
    drawing: {
      x: [-100, 0],
      y: [-50, 0],
      rotate: [-20, 0],
      opacity: [0, 1],
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 25
      }
    },
    exit: {
      x: 1000,
      y: -1000,
      rotate: 180,
      opacity: 0,
      transition: {
        duration: 0.5
      }
    }
  }

  // Kurpiyer animasyon varyantları
  const dealerVariants = {
    dealing: {
      rotate: [0, -20, 0],
      x: [0, -30, 0],
      transition: {
        duration: 0.5,
        repeat: playerCards.length + dealerCards.length,
        repeatDelay: 0.2
      }
    }
  }

  const renderCard = (card: Card, index: number, isDealing: boolean, isNewlyDrawn: boolean) => (
    <motion.div 
      key={`${card.rank}${card.suit}-${index}`}
      className="bg-white rounded-lg p-1 sm:p-4 w-10 sm:w-16 h-16 sm:h-24 flex items-center justify-center text-xs sm:text-base"
      variants={cardVariants}
      initial="initial"
      animate={isNewlyDrawn ? "drawing" : "dealing"}
      exit="exit"
      custom={index}
      layoutId={`${card.rank}${card.suit}-${index}`}
    >
      <span className={card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-black'}>
        {card.rank}{card.suit}
      </span>
    </motion.div>
  )

  // Modal için overlay animasyon varyantları
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  }

  // Modal için content animasyon varyantları
  const modalVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.8,
      y: 20
    },
    visible: { 
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 20
    }
  }

  // Ayarları sıfırlama fonksiyonu
  const resetSettings = () => {
    localStorage.removeItem('blackjackPlayerName')
    localStorage.removeItem('blackjackBalance')
    window.location.reload()
  }

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-green-900 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto relative">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 bg-black/30 p-4 rounded-xl backdrop-blur-sm space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <h1 className="text-3xl sm:text-4xl font-bold text-white text-center sm:text-left">
              Blackjack
            </h1>
            {playerName && (
              <span className="text-emerald-400 text-lg sm:text-xl">
                Oyuncu: {playerName}
              </span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-xl sm:text-2xl w-full sm:w-auto">
              <div className="bg-emerald-900/50 px-4 py-2 rounded-lg whitespace-nowrap">
                <span className="text-emerald-400">Bakiye:</span>
                <span className="text-white ml-2">${balance}</span>
              </div>
              {currentBet > 0 && (
                <div className="bg-amber-900/50 px-4 py-2 rounded-lg whitespace-nowrap">
                  <span className="text-amber-400">Bahis:</span>
                  <span className="text-white ml-2">${currentBet}</span>
                </div>
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetSettings}
              className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium whitespace-nowrap"
              title="Tüm ayarları sıfırla"
            >
              Sıfırla
            </motion.button>
          </div>
        </div>
        
        {/* Mesaj Modal */}
        <AnimatePresence mode="wait">
          {message && (
            <motion.div 
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={overlayVariants}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
            >
              <motion.div 
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={`bg-gradient-to-b ${
                  message.includes('BLACKJACK') 
                    ? 'from-purple-900 to-black border-yellow-500/50' 
                    : 'from-gray-900 to-black border-white/10'
                } p-6 rounded-xl shadow-2xl border max-w-md w-full mx-4`}
              >
                <div className="text-center">
                  {message.includes('BLACKJACK') && (
                    <div className="text-8xl mb-4">🎰</div>
                  )}
                  {message.includes('Kazandınız') && !message.includes('BLACKJACK') && (
                    <div className="text-6xl mb-4">🎉</div>
                  )}
                  {message.includes('Kaybettiniz') && (
                    <div className="text-6xl mb-4">😢</div>
                  )}
                  {message.includes('Berabere') && (
                    <div className="text-6xl mb-4">🤝</div>
                  )}
                  <h3 className={`text-2xl font-bold text-white mb-4 ${
                    message.includes('BLACKJACK') ? 'text-yellow-400' : ''
                  }`}>{message}</h3>
                  {message.includes('BLACKJACK') && (
                    <div className="text-yellow-400 text-xl mb-4">
                      +${Math.floor(currentBet * 2.5)}
                    </div>
                  )}
                  {message.includes('Kazandınız') && !message.includes('BLACKJACK') && (
                    <div className="text-emerald-400 text-xl mb-4">
                      +${currentBet * 2}
                    </div>
                  )}
                  {message.includes('Berabere') && (
                    <div className="text-amber-400 text-xl mb-4">
                      +${currentBet} (Bahis iade)
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Para bittiğinde gösterilecek modal */}
        <AnimatePresence>
          {balance <= 0 && gameStatus === 'waiting' && !currentBet && (
            <motion.div 
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={overlayVariants}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
            >
              <motion.div 
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-gradient-to-b from-red-900 to-black p-6 rounded-xl shadow-2xl border border-red-500/30 max-w-md w-full mx-4"
              >
                <div className="text-center">
                  <div className="mb-4 text-6xl">💔</div>
                  <h3 className="text-2xl font-bold text-white mb-3">Tebrikler Şampiyon!</h3>
                  <p className="text-gray-300 mb-6">
                    Tüm paranı kaybettin gerizekalı! Kredi çekmek istersen Ziraat Bank ve Akbank'a yönlendirebilirim seni aptal evladı! 
                  </p>
                  <div className="flex gap-4 justify-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={resetBalance}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-bold"
                    >
                      Yeni Oyun ($500)
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => window.open('https://www.ziraatbank.com.tr/tr/bireysel/krediler', '_blank')}
                      className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-bold"
                    >
                      Kredi Çek 💸
                    </motion.button>
                  </div>
                  <p className="text-gray-400 text-sm mt-4 italic">
                    "Kumar bir hastalıktır, ve sende bir hastasın"
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Yaş Uyarı Modalı */}
        <AnimatePresence>
          {showAgeWarning && (
            <motion.div 
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={overlayVariants}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
            >
              <motion.div 
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-gradient-to-b from-gray-900 to-black p-6 rounded-xl shadow-2xl border border-yellow-500/30 max-w-md w-full mx-4"
              >
                <div className="text-center">
                  <div className="mb-4 text-6xl">⚠️</div>
                  <h3 className="text-2xl font-bold text-white mb-4">Yaş Uyarısı</h3>
                  <p className="text-gray-300 mb-6">
                    Bu oyun sadece 18 yaşından büyükler içindir. Devam ederek 18 yaşından büyük olduğunuzu onaylıyorsunuz.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={confirmAge}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-bold"
                    >
                      18 Yaşından Büyüğüm
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setShowAgeWarning(false)
                        setCurrentBet(0)
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-bold"
                    >
                      İptal
                    </motion.button>
                  </div>
                  <p className="text-gray-400 text-sm mt-4">
                    Kumar bağımlılığı tehlikelidir. Lütfen sorumlu oynayın(Risk alamıyorsan barbie giydirme oyna!! 'tolgabayrak').
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* İsim Giriş Modalı */}
        <AnimatePresence>
          {showNamePrompt && (
            <motion.div 
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={overlayVariants}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
            >
              <motion.div 
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-gradient-to-b from-gray-900 to-black p-6 rounded-xl shadow-2xl border border-white/10 max-w-md w-full mx-4"
              >
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-4">Hoş Geldiniz!</h3>
                  <p className="text-gray-300 mb-4">Lütfen adınızı girin:</p>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-lg bg-black/50 border border-white/20 text-white mb-4"
                    placeholder="Adınız"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={20}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => playerName.trim() && confirmName(playerName)}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-bold"
                    disabled={!playerName.trim()}
                  >
                    Başla
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Oyun İçeriği */}
        {(balance > 0 || currentBet > 0) && (
          <>
            {isBetting ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <h2 className="text-3xl text-white mb-8 font-bold">Bahsinizi Seçin</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-2xl mx-auto px-2 sm:px-0">
                  {betOptions.map((amount) => (
                    <motion.button
                      key={amount}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => placeBet(amount)}
                      disabled={amount > balance || currentBet > 0 || gameStatus === 'playing'}
                      className={`
                        relative overflow-hidden group
                        px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-bold text-lg sm:text-xl shadow-lg
                        ${amount <= balance && !currentBet && gameStatus !== 'playing'
                          ? 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white'
                          : 'bg-gray-500/50 text-gray-300 cursor-not-allowed'
                        }
                      `}
                    >
                      <span className="relative z-10">${amount}</span>
                      {amount <= balance && !currentBet && gameStatus !== 'playing' && (
                        <motion.div
                          className="absolute inset-0 bg-white/20"
                          initial={{ x: '-100%' }}
                          whileHover={{ x: '100%' }}
                          transition={{ duration: 0.5 }}
                        />
                      )}
                    </motion.button>
                  ))}
                </div>
                <p className="text-gray-300 mt-6">
                  Mevcut Bakiye: ${balance}
                </p>
              </motion.div>
            ) : (
              <div className="space-y-8">
                {/* Kurpiyer */}
                <motion.div
                  className="fixed top-4 right-4 w-16 h-16 sm:w-20 sm:h-20 z-40"
                  animate={isDealing ? "dealing" : "idle"}
                  variants={dealerVariants}
                >
                  <img 
                    src="/dealer3.png" 
                    alt="Dealer" 
                    className="w-full h-full object-contain rounded-full border-2 border-white/30"
                  />
                </motion.div>

                {/* Dealer'ın kartları */}
                <div className="bg-black/30 p-2 sm:p-6 rounded-xl backdrop-blur-sm">
                  <h2 className="text-lg sm:text-2xl text-white mb-2 sm:mb-4 font-semibold">
                    Dealer&apos;ın Kartları: 
                    <span className="ml-2 text-emerald-400">
                      {dealerCards.length > 0 && `(${calculateHandValue(dealerCards)})`}
                    </span>
                  </h2>
                  <div className="min-h-[80px] sm:min-h-[120px] bg-black/20 rounded-lg p-2 sm:p-4">
                    <AnimatePresence>
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {dealerCards.map((card, index) => 
                          renderCard(card, index, isDealing, false)
                        )}
                      </div>
                    </AnimatePresence>
                  </div>
                </div>

                {/* Oyuncunun kartları */}
                <div className="bg-black/30 p-2 sm:p-6 rounded-xl backdrop-blur-sm">
                  <h2 className="text-lg sm:text-2xl text-white mb-2 sm:mb-4 font-semibold">
                    Sizin Kartlarınız:
                    {playerCards.length > 0 && (
                      <span className="ml-2 text-emerald-400">
                        ({calculateHandValue(playerCards)})
                      </span>
                    )}
                  </h2>
                  <div className="min-h-[80px] sm:min-h-[120px] bg-black/20 rounded-lg p-2 sm:p-4">
                    <AnimatePresence>
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {playerCards.map((card, index) => 
                          renderCard(card, index, isDealing, index === justDrawnCard)
                        )}
                      </div>
                    </AnimatePresence>
                  </div>
                </div>

                {/* Kontrol butonları */}
                <motion.div 
                  className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-2 sm:px-0"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {gameStatus === 'playing' ? (
                    <>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 sm:px-8 py-2 sm:py-4 rounded-xl font-bold text-base sm:text-xl shadow-lg
                          bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white w-full sm:w-auto"
                        onClick={hit}
                      >
                        Kart Çek
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 sm:px-8 py-2 sm:py-4 rounded-xl font-bold text-base sm:text-xl shadow-lg
                          bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white w-full sm:w-auto"
                        onClick={stand}
                      >
                        Dur
                      </motion.button>
                    </>
                  ) : gameStatus === 'waiting' && !isBetting && balance > 0 ? (
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-lg sm:text-xl shadow-lg
                          bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white w-full sm:w-auto"
                        onClick={startNewHand}
                        disabled={lastBet > balance}
                      >
                        Aynı Bahis (${lastBet})
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-lg sm:text-xl shadow-lg
                          bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white w-full sm:w-auto"
                        onClick={() => setIsBetting(true)}
                      >
                        Bahis Değiştir
                      </motion.button>
                    </div>
                  ) : null}
                </motion.div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
