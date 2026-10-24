# Hồ koi thủy mặc

Hồ cá koi nhìn từ trên xuống theo phong cách tranh thủy mặc, làm bằng three.js.

- Giấy washi, bờ đá chấm mực, đèn đá, thư pháp và triện theo mùa.
- Bốn mùa: anh đào (xuân), sen và chuồn chuồn (hạ), phong đỏ và chuồn chuồn ớt (thu), mai trơ cành phủ tuyết (đông). Hoa lá rụng theo gió rồi nhú lại.
- Mặt nước mô phỏng sóng: rê chuột để khuấy nước, gợn vẽ như nét mực.
- Cá koi 3D bơi bằng vertex shader: thân bám theo vệt bơi, đuôi nối liền sóng thân, vây ngực/vây bụng quạt, hoa văn chọn ngẫu nhiên theo độ hiếm của 13 giống.
- Click để thả thức ăn: cá ngoi lên đớp.

## Chạy

```bash
npm install
npm run dev
```

## Ghi công

- Model cá: ["Koi Fish"](https://sketchfab.com/3d-models/koi-fish-236859b809984f52b70c94fd040b9c59) by 7PLUS, giấy phép [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/). Mesh được biến dạng và tô lại màu bằng shader.
- Model ếch: ["Frog"](https://sketchfab.com/3d-models/frog-436deb1555fa42b9bc146e1b6b0d1ebc) by Thunk3D scanner (Diana123456), giấy phép [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/). Đã giảm lưới, xoay lại trục và tô lại màu thuỷ mặc theo đỉnh.
