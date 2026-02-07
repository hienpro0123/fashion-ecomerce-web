import * as Route from '@/constants/routes';
import React from 'react';
import { useLocation } from 'react-router-dom';
import logoIUH from '../../../static/iuh.png';
import logoGHN from '../../../static/ghn.webp';

const Footer = () => {
  const { pathname } = useLocation();

  const visibleOnlyPath = [
    Route.HOME,
    Route.SHOP
  ];

  if (!visibleOnlyPath.includes(pathname)) return null;

  return (
    <footer className="footer">
      <div className="footer-container">

        {/* COL 1 */}
        <div className="footer-col">
          <h4>About LORDMEN</h4>
          <h2 className="footer-brand">LORDMEN</h2>
          <p>
            LORDMEN – Thương hiệu thời trang nam hướng tới sự tối giản,
            lịch lãm và hiện đại. Chúng tôi mang đến những sản phẩm
            chất lượng cao với mức giá hợp lý cho nam giới Việt.
          </p>
        </div>

        {/* COL 2 */}
        <div className="footer-col">
          <h4>Business Partnerships</h4>
          <p>Địa chỉ: Gò Vấp, TP. Hồ Chí Minh</p>
          <p>Số điện thoại: 0936 611 611</p>
          <p>Email: contact@lordmen.vn</p>

          <h4 style={{ marginTop: '1.5rem' }}>Shipping Methods</h4>
          <img
            className="shipping-logo"
            src={logoGHN}
            alt="GHN Express"
          />
        </div>

        {/* COL 3 */}
        <div className="footer-col">
          <h4>Customer Support & Policies</h4>
          <ul>
            <li>Giới thiệu</li>
            <li>Liên hệ</li>
            <li>Hệ thống cửa hàng</li>
            <li>Phương thức thanh toán</li>
            <li>Chính sách giao hàng</li>
            <li>Chính sách đổi trả</li>
            <li>Chính sách bảo mật</li>
          </ul>
        </div>

        {/* COL 4 */}
        <div className="footer-col">
          <h4>Subscribe to Our Newsletter</h4>
          <p>Nhận thông tin sản phẩm mới và ưu đãi đặc biệt.</p>

          <div className="newsletter">
            <input
              type="email"
              placeholder="Nhập email của bạn"
            />
            <button>ĐĂNG KÝ</button>
          </div>

          <div className="footer-cert">
            <img
              className="iuh"
              src={logoIUH}
              alt="Đại Học Công Nghiệp TP.HCM"
            />
            <span>
              Industrial University of <br />
              Ho Chi Minh City
            </span>
          </div>
        </div>

      </div> {/* ✅ ĐÓNG footer-container */}

      <div className="footer-bottom">
        Copyright © {new Date().getFullYear()} LORDMEN.
        All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
