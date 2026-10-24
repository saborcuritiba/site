(function ($) {
  let cardapioCache = [];

  function carregarCardapio(callback) {
    if (cardapioCache.length > 0) {
      callback(cardapioCache);
      return;
    }

    $.getJSON("/json/cardapio.json", function (data) {
      processarDadosJson(data, callback);
    }).fail(function () {
      $.getJSON("../../json/cardapio.json", function (data) {
        processarDadosJson(data, callback);
      }).fail(function () {
        console.error("SaborHtmlDynamic: Erro ao carregar o cardapio.json");
      });
    });
  }

  function processarDadosJson(data, callback) {
    cardapioCache = [];
    if (data.categorias) {
      data.categorias.forEach((cat) => {
        cat.produtos.forEach((prod) => {
          if (prod.ativo !== false) {
            prod.linhaNome = cat.nome || "Linha Dia a Dia";
            cardapioCache.push(prod);
          }
        });
      });
    }
    callback(cardapioCache);
  }

  // 1. Layout do Carrossel (Moderno com botão de compra)
  function gerarCardCarrosselHtml(produto) {
    let fotoPath = produto.foto.startsWith("/")
      ? produto.foto
      : "/" + produto.foto;
    let precoFormatado = Number(produto.preco).toFixed(2).replace(".", ",");
    let urlDetalhes = produto.link || `produtos/${produto.id}/index.html`;
    let descricaoCurta = produto.descricao || "";
    let linhaTag = produto.linha || produto.linhaNome || "Linha Dia a Dia";

    return `
      <div class="img-box adv-img adv-img-half-content" data-anima="fade-left" data-trigger="hover" style="height: 100%; display: flex; flex-direction: column;">
        <i class="fa fa-camera-retro anima"></i>

        <a href="${urlDetalhes}" class="img-box anima-scale-up anima" style="text-decoration: none">
          <img src="${fotoPath}" alt="${produto.nome}" class="img-responsive" onerror="this.src='/images/logo_retangular.png'" />
        </a>

        <div class="caption" style="display: flex; flex-direction: column; justify-content: space-between; flex: 1;">
          <div>
            <a href="${urlDetalhes}" style="text-decoration: none; color: inherit; display: block">
              <h2 style="font-size: 18px; margin-bottom: 8px;">${produto.nome}</h2>
              <p style="
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
                text-overflow: ellipsis;
                margin-bottom: 8px;
              ">${descricaoCurta}</p>
              <p class="sub" style="margin-bottom: 0;">${linhaTag}</p>
            </a>
          </div>

          <div style="margin-top: 15px; display: flex; align-items: center; justify-content: space-between; position: relative; z-index: 10; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 12px;">
            <span style="font-size: 18px; font-weight: bold; color: #ffffff;">
              R$ ${precoFormatado}
            </span>

            <button
              type="button"
              class="btn btn-primary btn-comprar"
              data-id="${produto.id}"
              onclick="event.stopPropagation(); event.preventDefault(); $.SaborCart.addItem('${produto.id}'); return false;"
              style="
                background-color: #436541;
                border-color: #436541;
                color: #ffffff;
                padding: 8px 16px;
                font-weight: bold;
                border-radius: 4px;
                cursor: pointer;
              "
            >
              <i class="im-shop-3" style="margin-right: 6px"></i>Comprar
            </button>
          </div>

        </div>
      </div>
    `;
  }

  // 2. Layout Clássico Original para os Cards Fixos de Cima
  function gerarCardFixoHtml(produto) {
    let fotoPath = produto.foto.startsWith("/")
      ? produto.foto
      : "/" + produto.foto;
    let precoFormatado = Number(produto.preco).toFixed(2).replace(".", ",");
    let urlDetalhes = produto.link || `produtos/${produto.id}/index.html`;
    let descricaoCurta = produto.descricao || "";
    let linhaTag = produto.linha || produto.linhaNome || "Linha Dia a Dia";

    return `
      <div
        class="img-box adv-img adv-img-half-content"
        data-anima="fade-left"
        data-trigger="hover"
      >
        <i class="fa fa-camera-retro anima"></i>

        <a
          href="${urlDetalhes}"
          class="img-box anima-scale-up anima"
          style="text-decoration: none"
        >
          <img
            src="${fotoPath}"
            alt="${produto.nome}"
            class="img-responsive"
            onerror="this.src='/images/logo_retangular.png'"
          />
        </a>

        <a
          href="${urlDetalhes}"
          style="text-decoration: none; color: inherit; display: block"
        >
          <div class="caption">
            <h2>${produto.nome}</h2>
            <span class="extra-content"> R$ ${precoFormatado} </span>
            <p>${descricaoCurta}</p>
            <p class="sub">${linhaTag}</p>
          </div>
        </a>
      </div>
    `;
  }

  // Auto-inicialização ao carregar o DOM
  $(document).ready(function () {
    const $containersCarrossel = $(".sabor-carrossel-produtos");
    const $containersCardsFixos = $(".sabor-cards-fixos");

    if (!$containersCarrossel.length && !$containersCardsFixos.length) return;

    carregarCardapio(function (produtos) {
      // Renderiza o Carrossel
      if ($containersCarrossel.length) {
        let slidesHtml = "";
        produtos.forEach((produto) => {
          slidesHtml += `<div class="swiper-slide">${gerarCardCarrosselHtml(produto)}</div>`;
        });

        $containersCarrossel.each(function () {
          const $container = $(this);
          $container.html(`
            <div class="swiper productSwiperInstance">
              <div class="swiper-wrapper">
                ${slidesHtml}
              </div>
              <div class="swiper-button-next"></div>
              <div class="swiper-button-prev"></div>
              <div class="swiper-pagination"></div>
            </div>
          `);

          new Swiper($container.find(".productSwiperInstance")[0], {
            slidesPerView: 1,
            spaceBetween: 15,
            loop: true,
            grabCursor: true,
            breakpoints: {
              576: { slidesPerView: 2, spaceBetween: 20 },
              768: { slidesPerView: 3, spaceBetween: 20 },
              1024: { slidesPerView: 3, spaceBetween: 30 },
            },
            navigation: {
              nextEl: $container.find(".swiper-button-next")[0],
              prevEl: $container.find(".swiper-button-prev")[0],
            },
            pagination: {
              el: $container.find(".swiper-pagination")[0],
              clickable: true,
            },
          });
        });
      }

      // Renderiza a Grade de Cards Fixos de Cima exatamente no padrão original
      if ($containersCardsFixos.length) {
        let gridHtml = "";
        let produtosNaLinha = 0;

        produtos.forEach((produto, index) => {
          if (produtosNaLinha === 0) {
            gridHtml += `<div class="row">`;
          }

          gridHtml += `<div class="col-md-4">${gerarCardFixoHtml(produto)}</div>`;
          produtosNaLinha++;

          if (produtosNaLinha === 3 || index === produtos.length - 1) {
            gridHtml += `</div>`;
            if (index !== produtos.length - 1) {
              gridHtml += `<hr class="space m" />`;
            }
            produtosNaLinha = 0;
          }
        });

        $containersCardsFixos.html(gridHtml);
      }
    });
  });
})(jQuery);
