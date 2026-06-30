import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

new_style = """
        /* Vercel-inspired Design System & Variables */
        :root {
            --bg-dark: #000000;
            --bg-card: #0a0a0a;
            --bg-card-hover: #111111;
            --border-color: #333333;
            --border-hover: #888888;

            --text-main: #ededed;
            --text-muted: #888888;
            --text-white: #ffffff;
            --text-black: #000000;

            --primary: #ffffff;
            --primary-hover: #cccccc;
            --accent: #0070f3;

            --font-headings: 'Inter', sans-serif;
            --font-body: 'Inter', sans-serif;
            --transition: all 0.2s ease;
        }

        /* Base & Scrollbar Reset */
        body {
            background-color: var(--bg-dark);
            color: var(--text-main);
            font-family: var(--font-body);
            overflow-x: hidden;
            margin: 0;
            padding: 0;
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
        }

        ::-webkit-scrollbar {
            width: 8px;
        }

        ::-webkit-scrollbar-track {
            background: var(--bg-dark);
        }

        ::-webkit-scrollbar-thumb {
            background: #333;
            border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: #666;
        }

        /* Typography */
        h1, h2, h3, h4, h5, h6 {
            font-family: var(--font-headings);
            font-weight: 700;
            letter-spacing: -0.04em;
            color: var(--text-white);
        }

        p {
            color: var(--text-muted);
        }

        /* Sticky Header styling */
        header {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            z-index: 1000;
            background: transparent;
            transition: var(--transition);
            border-bottom: 1px solid transparent;
        }

        header.scrolled {
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-bottom: 1px solid var(--border-color);
        }

        .nav-container {
            display: flex;
            align-items: center;
            justify-content: space-between;
            max-width: 1200px;
            margin: 0 auto;
            padding: 15px 24px;
        }

        .logo img {
            height: 35px;
            width: auto;
            max-width: 100%;
            object-fit: contain;
            transition: var(--transition);
            filter: grayscale(100%) brightness(200%);
        }

        .nav-links {
            display: flex;
            align-items: center;
            gap: 32px;
            list-style: none;
            margin: 0;
            padding: 0;
        }

        .nav-links a {
            color: var(--text-muted);
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
            transition: var(--transition);
        }

        .nav-links a:hover,
        .nav-links li.active a {
            color: var(--text-white);
        }

        .header-actions {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        /* Buttons Styling */
        .btn-premium {
            background: var(--primary);
            color: var(--text-black);
            font-weight: 500;
            border-radius: 6px;
            padding: 8px 16px;
            border: 1px solid var(--primary);
            text-decoration: none;
            transition: var(--transition);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
        }

        .btn-premium:hover {
            background: var(--primary-hover);
            border-color: var(--primary-hover);
            color: var(--text-black);
        }

        .btn-outline-premium {
            background: transparent;
            color: var(--text-main);
            font-weight: 500;
            border-radius: 6px;
            padding: 8px 16px;
            border: 1px solid var(--border-color);
            text-decoration: none;
            transition: var(--transition);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
        }

        .btn-outline-premium:hover {
            border-color: var(--border-hover);
            background: var(--bg-card-hover);
            color: var(--text-white);
        }

        .mobile-toggler {
            display: none;
            background: none;
            border: none;
            color: var(--text-white);
            font-size: 24px;
            cursor: pointer;
        }

        /* Mobile Sidebar Menu */
        .mobile-sidebar {
            position: fixed;
            top: 0;
            right: -100%;
            width: 300px;
            height: 100vh;
            background: var(--bg-card);
            z-index: 1010;
            border-left: 1px solid var(--border-color);
            padding: 40px 24px;
            display: flex;
            flex-direction: column;
            gap: 40px;
            transition: 0.3s ease;
        }

        .mobile-sidebar.open {
            right: 0;
        }

        .mobile-sidebar-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.8);
            z-index: 1005;
            display: none;
        }

        .mobile-sidebar-overlay.active {
            display: block;
        }

        .mobile-links {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 24px;
        }

        .mobile-links a {
            color: var(--text-muted);
            text-decoration: none;
            font-size: 16px;
            font-weight: 500;
            transition: var(--transition);
        }

        .mobile-links a:hover {
            color: var(--text-white);
        }

        /* Hero / Swiper Slider Redesign */
        .hero-section {
            position: relative;
            height: 85vh;
            min-height: 600px;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            background: radial-gradient(circle at center, #111 0%, #000 100%);
            margin-top: 0;
            padding-top: 80px;
        }

        .swiper-container {
            width: 100%;
            height: 100%;
            display: none;
        }

        .hero-content {
            position: relative;
            z-index: 10;
            max-width: 800px;
            padding: 0 24px;
            margin: 0 auto;
        }

        .hero-tag {
            background: transparent;
            border: 1px solid var(--border-color);
            color: var(--text-muted);
            font-size: 12px;
            font-weight: 500;
            padding: 6px 12px;
            border-radius: 20px;
            display: inline-block;
            margin-bottom: 24px;
            letter-spacing: 0;
        }

        .hero-title {
            font-size: 4rem;
            line-height: 1.1;
            margin-bottom: 24px;
            background: linear-gradient(180deg, #fff 0%, #aaa 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: -0.05em;
        }

        .hero-text {
            font-size: 1.25rem;
            margin-bottom: 40px;
            color: var(--text-muted);
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }

        .hero-btns {
            display: flex;
            gap: 16px;
            justify-content: center;
            flex-wrap: wrap;
        }

        /* Check Bill Section */
        .section-padding {
            padding: 120px 0;
        }

        .section-header {
            text-align: center;
            max-width: 700px;
            margin: 0 auto 64px;
        }

        .section-subtitle {
            color: var(--text-muted);
            font-size: 14px;
            font-weight: 500;
            display: block;
            margin-bottom: 12px;
        }

        .section-title {
            font-size: 3rem;
            margin-bottom: 20px;
            letter-spacing: -0.04em;
        }

        .glass-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 40px;
            transition: var(--transition);
        }

        .glass-card:hover {
            border-color: var(--border-hover);
        }

        /* Form styling */
        .check-bill-form {
            display: flex;
            gap: 12px;
            margin-bottom: 20px;
        }

        .check-bill-input {
            flex-grow: 1;
            background: var(--bg-dark);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            padding: 12px 16px;
            color: var(--text-main);
            font-size: 14px;
            font-family: var(--font-body);
            transition: var(--transition);
        }

        .check-bill-input:focus {
            outline: none;
            border-color: var(--text-muted);
        }

        .btn-search {
            background: var(--primary);
            border: none;
            border-radius: 6px;
            width: 48px;
            height: 46px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: var(--transition);
            color: var(--text-black);
        }

        .btn-search:hover {
            background: var(--primary-hover);
        }
        
        .btn-search svg {
            width: 18px;
            height: 18px;
        }

        /* Internet Packages Pricing Grid */
        .pricing-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 24px;
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 24px;
        }

        .price-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 40px 30px;
            text-align: left;
            position: relative;
            transition: var(--transition);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }

        .price-card.popular {
            border-color: var(--text-muted);
        }

        .price-card.popular::before {
            content: 'Most Popular';
            position: absolute;
            top: -12px;
            left: 30px;
            background: var(--text-white);
            color: var(--text-black);
            font-size: 11px;
            font-weight: 600;
            padding: 4px 12px;
            border-radius: 12px;
            letter-spacing: 0;
        }

        .price-card:hover {
            border-color: var(--border-hover);
        }

        .pack-img {
            display: none;
        }

        .price-name {
            font-size: 14px;
            color: var(--text-muted);
            margin-bottom: 8px;
            font-weight: 500;
        }

        .price-speed {
            font-size: 2rem;
            font-weight: 700;
            color: var(--text-white);
            margin-bottom: 24px;
            letter-spacing: -0.04em;
        }

        .price-val {
            font-size: 2.5rem;
            font-weight: 700;
            color: var(--text-white);
            margin-bottom: 30px;
            display: flex;
            align-items: baseline;
            gap: 4px;
            letter-spacing: -0.04em;
        }

        .price-val span {
            font-size: 14px;
            color: var(--text-muted);
            font-weight: 400;
            letter-spacing: 0;
        }

        .price-features {
            list-style: none;
            padding: 0;
            margin: 0 0 32px;
            text-align: left;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .price-features li {
            font-size: 14px;
            color: var(--text-muted);
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .price-features li::before {
            content: '';
            width: 16px;
            height: 16px;
            background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>');
            background-size: contain;
            background-repeat: no-repeat;
            display: inline-block;
        }

        /* Services Grid Redesign */
        .services-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 24px;
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 24px;
        }

        .service-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 32px;
            transition: var(--transition);
            display: flex;
            flex-direction: column;
            gap: 20px;
            justify-content: space-between;
        }

        .service-card:hover {
            border-color: var(--border-hover);
        }

        .service-img {
            display: none;
        }

        .service-title {
            font-size: 18px;
            margin-bottom: 8px;
        }

        .service-text {
            font-size: 14px;
            color: var(--text-muted);
            margin: 0;
        }

        /* Modals Modern styling */
        .modal-content {
            background-color: var(--bg-card) !important;
            border: 1px solid var(--border-color) !important;
            border-radius: 12px !important;
            color: var(--text-main) !important;
        }

        .modal-header {
            border-bottom: 1px solid var(--border-color) !important;
            padding: 24px !important;
        }

        .modal-body {
            padding: 24px !important;
            font-size: 14px;
        }

        .modal-title {
            font-size: 20px;
            letter-spacing: -0.02em;
        }

        .btn-close {
            filter: invert(1) grayscale(100%) brightness(200%);
            opacity: 0.5 !important;
            transition: var(--transition);
        }

        .btn-close:hover {
            opacity: 1 !important;
        }

        /* Coverage Map Container styling */
        .map-section {
            background: var(--bg-dark);
            border-top: 1px solid var(--border-color);
            border-bottom: 1px solid var(--border-color);
        }

        .map-wrapper {
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid var(--border-color);
            background: var(--bg-card);
        }

        #mapid {
            height: 500px;
            width: 100%;
        }

        /* Speedtest wrapper */
        .speedtest-container {
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid var(--border-color);
            background: var(--bg-card);
        }

        /* About Us styling */
        .about-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 24px;
        }

        .about-main-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 40px;
        }

        .about-side {
            display: flex;
            flex-direction: column;
            gap: 24px;
        }

        .about-side-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 40px;
            transition: var(--transition);
            flex: 1;
        }

        .about-side-card:hover {
            border-color: var(--border-hover);
        }

        /* Footer styling */
        footer {
            background-color: var(--bg-dark);
            border-top: 1px solid var(--border-color);
            padding: 64px 0 32px;
            font-size: 14px;
        }

        .footer-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 40px;
            max-width: 1200px;
            margin: 0 auto 40px;
            padding: 0 24px;
        }

        .footer-logo img {
            max-width: 120px;
            height: auto;
            margin-bottom: 24px;
            filter: grayscale(100%) brightness(200%);
        }

        .footer-col h4 {
            font-size: 14px;
            margin-bottom: 16px;
            color: var(--text-white);
            font-weight: 500;
        }

        .footer-links {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .footer-links a {
            color: var(--text-muted);
            text-decoration: none;
            transition: var(--transition);
        }

        .footer-links a:hover {
            color: var(--text-white);
        }

        .footer-contact {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .footer-contact li {
            display: flex;
            align-items: center;
            gap: 12px;
            color: var(--text-muted);
        }
        
        .footer-contact svg {
            stroke: var(--text-muted);
        }

        .footer-contact a {
            color: var(--text-muted);
            text-decoration: none;
            transition: var(--transition);
        }

        .footer-contact a:hover {
            color: var(--text-white);
        }

        .footer-bottom {
            max-width: 1200px;
            margin: 0 auto;
            padding: 24px 24px 0;
            border-top: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 16px;
            color: var(--text-muted);
            font-size: 14px;
        }

        /* Floating PWAs Install banner */
        #installBanner {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 320px;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 24px;
            z-index: 9999;
            display: none;
            flex-direction: column;
            align-items: center;
            text-align: center;
        }

        #installBanner img.logo {
            height: 30px;
            width: auto;
            margin-bottom: 12px;
            filter: grayscale(100%) brightness(200%);
        }

        #installBanner h6 {
            margin-bottom: 8px;
            font-size: 16px;
        }

        #installBanner p {
            font-size: 14px;
            margin-bottom: 16px;
        }

        /* Preloader Styles */
        .preloader {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: var(--bg-dark);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .loader-ring {
            width: 40px;
            height: 40px;
            border: 2px solid var(--border-color);
            border-top: 2px solid var(--text-white);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        body.no-scroll {
            overflow: hidden !important;
        }

        /* Media Queries */
        @media (max-width: 992px) {
            .nav-links, .header-actions { display: none; }
            .mobile-toggler { display: block; }
            .about-grid, .footer-grid { grid-template-columns: 1fr; }
            .hero-title { font-size: 3rem; }
        }

        @media (max-width: 768px) {
            .section-padding { padding: 80px 0; }
            .section-title { font-size: 2.5rem; }
            #mapid { height: 350px; }
            .speedtest-container iframe { height: 450px !important; }
        }

        @media (max-width: 576px) {
            .hero-title { font-size: 2.5rem; }
            .hero-text { font-size: 1rem; }
            .hero-section { min-height: 500px; padding: 100px 0 60px; }
            .glass-card, .price-card, .service-card, .about-main-card, .about-side-card {
                padding: 24px;
            }
        }
"""

new_content = re.sub(r'<style>.*?</style>', f'<style>\n{new_style}\n    </style>', content, flags=re.DOTALL)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Replaced style block.")
