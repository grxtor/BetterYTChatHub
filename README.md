# BetterYTChatHub 🚀

> **Yüksek Performanslı YouTube Canlı Yayın Sohbet Yönetimi ve Overlay Sistemi.**

Canlı yayınlarınızı hız, netlik ve derinlemesine özelleştirme için tasarlanmış profesyonel düzeyde bir panel ile güçlendirin. BetterYTChatHub, YouTube Live sohbetini prodüksiyon kalitesinde OBS overlay'leri ile kusursuz bir şekilde birleştirir.

---

## 📸 Arayüz Önizlemesi

| Dashboard Genel Bakış | Gelişmiş Ayarlar | Özel Overlay'ler | Hassas Metin Seçimi |
|:---:|:---:|:---:|:---:|
| ![Dashboard Overview](https://github.com/grxtor/BetterYTChatHub/blob/master/ScreenShots/Ekran%20Resmi%202026-12-31%2014.14.03.png?raw=true) | ![Advanced Settings](https://github.com/grxtor/BetterYTChatHub/blob/master/ScreenShots/Ekran%20Resmi%202026-12-31%2014.22.52.png?raw=true)| ![Custom Overlays](https://github.com/grxtor/BetterYTChatHub/blob/master/ScreenShots/Ekran%20Resmi%202026-12-31%2014.12.37.png?raw=true) | ![Text Selection](https://github.com/grxtor/BetterYTChatHub/blob/master/ScreenShots/Ekran%20Resmi%202026-12-31%2014.20.28.png?raw=true) |

---

## ✨ Öne Çıkan Özellikler

### 🖱️ Hassas Metin Seçimi (ÖZEL)
Standart YouTube sohbet arayüzünün kısıtlamalarından kurtulun.
- **Kolay Kopyalama**: Dashboard üzerindeki herhangi bir mesajı (normal mesaj, üye mesajı veya Super Chat) anında seçebilir ve kopyalayabilirsiniz.
- **Hızlı Etkileşim**: Seçtiğiniz metinleri üzerinde işlem yapmak, araştırmak veya hızlı yanıtlar oluşturmak için kullanabilirsiniz.

---

## 💡 Neden BetterYTChatHub?

Bir yayıncı olarak canlı sohbeti yönetmek kaotik olabilir. Standart YouTube arayüzü genellikle kalabalıktır ve belirli mesajlara odaklanmayı zorlaştırır. **BetterYTChatHub** bu boşluğu şu avantajlarla doldurur:

*   **Akıcı Etkileşim**: Mesaj arama zahmetine son. Sadece önemli olana odaklanan özel bir panel.
*   **Prodüksiyon Kalitesi**: Profesyonel TV yayınlarındaymış gibi hissettiren üst düzey overlay tasarımları.
*   **Bağımsız Çalışma**: Ana YouTube sekmenizi etkilemez; maksimum kararlılık için bağımsız çalışır.

---

## ✨ Temel Kabiliyetler

### 🎯 Mesaj Odaklama (Tek Tıkla)
Cihazınızdaki herhangi bir mesajı, Super Chat'i veya Üyelik uyarısını anında OBS overlay'inde vurgulayın.
- **Akıllı Kuyruk**: Mevcut vurgulanan mesajı yenisiyle sorunsuz bir şekilde değiştirin.
- **Otomatik Seçim**: Destekçilerinizin asla gözden kaçmaması için Super Chat ve Üyeler için "Otomatik Seç" özelliğini aktif edin.

### 📋 Yayıncı İş Akışı Verimliliği
- **Tek Tıkla URL Kopyalama**: OBS overlay URL'lerini doğrudan panelden hızlıca kopyalayın.
- **Global Durum İzleme**: Backend API bağlantı durumunu doğrudan başlıktan takip edin.

### 📐 Dinamik Ölçeklendirme ve Çözünürlük
- **Çözünürlük Bağımsızlığı**: Overlay'ler yüksek DPI uyumludur. Herhangi bir yayın çözünürlüğüne (720p'den 4K+'ya) sığması için ölçeklendirme sürgülerini kullanın.
- **Bağımsız Yerleşim**: Normal sohbeti, Super Chat'leri ve Üyeleri ekranın farklı köşelerine yerleştirmek için her kategoriye özel konumlandırma ayarlarını kullanın.

### 🎨 Profesyonel Özelleştirme Motoru
- **Gelişmiş Tasarım**: Uzun kullanıcı adlarını bile profesyonelce yöneten, ad ve miktar istifleme sistemine sahip özel tasarım.
- **Canlı Gradyanlar**: Üyelik uyarıları için benzersiz başlangıç/bitiş renk kontrolleri.
- **CSS Müdahalesi**: İleri düzey kullanıcılar için her mesaj kategorisine özel CSS enjekte etme imkanı.

---

## 🛠️ Teknoloji Yığını

| Katman | Teknoloji |
|:---|:---|
| **Frontend Framework** | [Next.js 15](https://nextjs.org/) (React 19) |
| **Backend Engine** | [Node.js](https://nodejs.org/) + [Fastify](https://www.fastify.io/) |
| **Desktop Wrapper** | [Electron](https://www.electronjs.org/) |
| **Veri Tipleri** | TypeScript / Zod |
| **Styling** | El Yapımı Vanilla CSS |

---

## 🚀 Başlangıç

### Ön Gereksinimler

- [Node.js](https://nodejs.org/) (v20.x veya üzeri)
- [pnpm](https://pnpm.io/) (Önerilen) veya `npm`

### Kurulum ve Çalıştırma

1.  **Projeyi Klonlayın:**
    ```bash
    git clone https://github.com/grxtor/BetterYTChatHub.git
    cd BetterYTChatHub
    ```

2.  **Bağımlılıkları Yükleyin:**
    ```bash
    pnpm install
    # veya
    npm install
    ```

3.  **Geliştirme Modunda Başlatın:**
    Hem backend hem de frontend'i aynı anda başlatmak için:
    ```bash
    pnpm dev
    # veya
    npm run dev
    ```

4.  **Uygulamayı Paketleyin (Opsiyonel):**
    Electron ile masaüstü uygulaması olarak paketlemek için:
    ```bash
    pnpm build
    ```

---

## 📡 Erişim Noktaları

| Bileşen | Yerel URL |
|:---|:---|
| **Dashboard** | `http://localhost:3000/dashboard` |
| **Ana Overlay** | `http://localhost:3000/overlay` |
| **Üyeler Overlay** | `http://localhost:3000/members` |
| **Super Chat Overlay** | `http://localhost:3000/superchat` |

---

## 📄 Lisans

Bu proje **MIT Lisansı** ile lisanslanmıştır.
