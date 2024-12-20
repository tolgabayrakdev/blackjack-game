type Suit = '♠' | '♣' | '♥' | '♦'
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'

export type Card = {
  suit: Suit
  rank: Rank
  value: number
}

// Kart destesi oluştur
export function createDeck(): Card[] {
  const suits: Suit[] = ['♠', '♣', '♥', '♦']
  const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
  const deck: Card[] = []

  for (const suit of suits) {
    for (const rank of ranks) {
      let value: number
      if (rank === 'A') value = 11
      else if (['K', 'Q', 'J'].includes(rank)) value = 10
      else value = parseInt(rank)

      deck.push({ suit, rank, value })
    }
  }

  return shuffleDeck(deck)
}

// Desteyi karıştır
function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Toplam puanı hesapla (As için özel durum)
export function calculateHandValue(cards: Card[]): number {
  let total = 0
  let aces = 0

  // Önce As olmayan kartları topla
  for (const card of cards) {
    if (card.rank === 'A') {
      aces += 1
    } else {
      total += card.value
    }
  }

  // As'ları ekle
  for (let i = 0; i < aces; i++) {
    if (total + 11 <= 21) {
      total += 11
    } else {
      total += 1
    }
  }

  return total
} 