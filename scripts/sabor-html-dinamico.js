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

  // Injetar estilos do Lightbox Isolado
  function injetarEstilosLightbox() {
    if ($("#sabor-lightbox-style").length) return;
    $("<style id='sabor-lightbox-style'>")
      .text(
        `
      .sabor-lb-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      .sabor-lb-content {
        position: relative;
        max-width: 90%;
        max-height: 90%;
        text-align: center;
      }
      .sabor-lb-content img {
        max-width: 100%;
        max-height: 85vh;
        border-radius: 6px;
        box-shadow: 0 5px 25px rgba(0,0,0,0.5);
        object-fit: contain;
      }
      .sabor-lb-close {
        position: absolute;
        top: -40px;
        right: 0;
        color: #fff;
        font-size: 32px;
        font-weight: bold;
        cursor: pointer;
        background: none;
        border: none;
        outline: none;
      }
      .sabor-lb-close:hover {
        color: #ddd;
      }
      .sabor-galeria-item {
        background: #fff;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        overflow: hidden;
        box-shadow: 0 2px 6px rgba(0,0,0,0.05);
        transition: all 0.2s ease;
      }
      .sabor-galeria-item:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        transform: translateY(-2px);
      }
    `,
      )
      .appendTo("head");
  }

  // 3. Renderiza o Carrossel de Imagens da Página de Detalhes usando SWIPER + Lightbox Isolado
  function renderizarCarrosselImagens(produtos) {
    const $containerCarrossel = $(".sabor-carrossel-imagens");
    if (!$containerCarrossel.length) return;

    injetarEstilosLightbox();

    if (!$("#sabor-lightbox-modal").length) {
      $(`
        <div id="sabor-lightbox-modal" class="sabor-lb-overlay" style="display: none;">
          <div class="sabor-lb-content">
            <button type="button" class="sabor-lb-close">&times;</button>
            <img id="sabor-lb-img-el" src="" alt="Ampliada" />
          </div>
        </div>
      `).appendTo("body");

      $(document).on(
        "click",
        "#sabor-lightbox-modal, .sabor-lb-close",
        function (e) {
          if (
            e.target !== this &&
            !$(e.target).hasClass("sabor-lb-close") &&
            !$(e.target).is("#sabor-lightbox-modal")
          )
            return;
          $("#sabor-lightbox-modal").fadeOut(200);
        },
      );
      $(document).keyup(function (e) {
        if (e.key === "Escape") {
          $("#sabor-lightbox-modal").fadeOut(200);
        }
      });
    }

    $containerCarrossel.each(function () {
      const $el = $(this);
      const produtoId = $el.attr("data-produto-id");

      if (!produtoId) {
        console.warn(
          "SaborHtmlDynamic: Elemento .sabor-carrossel-imagens sem o atributo data-produto-id.",
        );
        return;
      }

      let produtoAtual = produtos.find((p) => p.id === produtoId);
      if (!produtoAtual) {
        console.error(
          "SaborHtmlDynamic: Produto não encontrado para o ID:",
          produtoId,
        );
        return;
      }

      let imagensList =
        produtoAtual.imagens && produtoAtual.imagens.length > 0
          ? produtoAtual.imagens
          : [produtoAtual.foto];

      let slidesHtml = "";

      imagensList.forEach((imgSrc) => {
        let fotoPath = imgSrc.startsWith("/") ? imgSrc.substring(1) : imgSrc;
        if (window.location.pathname.includes("/produtos/")) {
          fotoPath = "../../" + fotoPath.replace(/^(\.\.\/)+/, "");
        }

        slidesHtml += `
          <div class="swiper-slide" style="text-align: center;">
            <div class="sabor-galeria-item" style="cursor: pointer;" onclick="$('#sabor-lb-img-el').attr('src', '${fotoPath}'); $('#sabor-lightbox-modal').css('display', 'flex').fadeTo(200, 1);">
              <div style="width: 100%; aspect-ratio: 1 / 1; overflow: hidden; background: #f9f9f9; display: flex; align-items: center; justify-content: center;">
                <img src="${fotoPath}" alt="${produtoAtual.nome || ""}" style="width: 100%; height: 100%; object-fit: cover;" />
              </div>
            </div>
          </div>
        `;
      });

      // Injeta a estrutura do Swiper
      $el.html(`
        <div class="swiper produtoDetalheSwiperInstance" style="padding: 10px 0 35px 0;">
          <div class="swiper-wrapper">
            ${slidesHtml}
          </div>
          <div class="swiper-button-next"></div>
          <div class="swiper-button-prev"></div>
          <div class="swiper-pagination"></div>
        </div>
      `);

      // Configurado estritamente para 3 itens no desktop
      setTimeout(function () {
        if (typeof Swiper !== "undefined") {
          new Swiper($el.find(".produtoDetalheSwiperInstance")[0], {
            slidesPerView: 1,
            spaceBetween: 15,
            loop: false,
            grabCursor: true,
            breakpoints: {
              576: { slidesPerView: 2, spaceBetween: 15 },
              768: { slidesPerView: 3, spaceBetween: 15 },
              1024: { slidesPerView: 3, spaceBetween: 20 },
            },
            navigation: {
              nextEl: $el.find(".swiper-button-next")[0],
              prevEl: $el.find(".swiper-button-prev")[0],
            },
            pagination: {
              el: $el.find(".swiper-pagination")[0],
              clickable: true,
            },
          });
        }
      }, 150);
    });
  }

  // Auto-inicialização ao carregar o DOM
  $(document).ready(function () {
    const $containersCarrossel = $(".sabor-carrossel-produtos");
    const $containersCardsFixos = $(".sabor-cards-fixos");
    const $containersGaleriaImagens = $(".sabor-carrossel-imagens");

    if (
      !$containersCarrossel.length &&
      !$containersCardsFixos.length &&
      !$containersGaleriaImagens.length
    )
      return;

    carregarCardapio(function (produtos) {
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

      if ($containersGaleriaImagens.length) {
        renderizarCarrosselImagens(produtos);
      }
    });
  });
})(jQuery);
