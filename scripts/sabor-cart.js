(function ($) {
  const STORAGE_KEY = "sabor_curitiba_cart";
  let cardapioCache = [];

  $.SaborCart = {
    // Inicializa o carrinho e carrega o cache do cardápio
    init: function () {
      // Configurações do Toastr (tempo de exibição: 25 segundos)
      if (typeof toastr !== "undefined") {
        toastr.options = {
          closeButton: true,
          debug: false,
          newestOnTop: true,
          progressBar: true,
          positionClass: "toast-top-right",
          preventDuplicates: false,
          showDuration: "300",
          hideDuration: "1000",
          timeOut: "3000",
          extendedTimeOut: "2000",
          showEasing: "swing",
          hideEasing: "linear",
          showMethod: "fadeIn",
          hideMethod: "fadeOut",
          escapeHtml: false,
        };
      }

      $.getJSON("/json/cardapio.json", function (data) {
        cardapioCache = [];
        if (data.categorias) {
          data.categorias.forEach((cat) => {
            cat.produtos.forEach((prod) => {
              cardapioCache.push(prod);
            });
          });
        }
        $.SaborCart.renderUI();
      }).fail(function () {
        // Fallback caso o script seja chamado de uma subpasta profunda
        $.getJSON("../../json/cardapio.json", function (data) {
          cardapioCache = [];
          if (data.categorias) {
            data.categorias.forEach((cat) => {
              cat.produtos.forEach((prod) => {
                cardapioCache.push(prod);
              });
            });
          }
          $.SaborCart.renderUI();
        }).fail(function () {
          console.error("Erro ao carregar o cardapio.json");
        });
      });
    },

    // Recupera o carrinho do localStorage
    getCart: function () {
      const cart = localStorage.getItem(STORAGE_KEY);
      return cart ? JSON.parse(cart) : [];
    },

    // Salva o carrinho e atualiza a interface
    saveCart: function (cart) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
      $.SaborCart.renderUI();
    },

    // Adiciona produto buscando pelo ID explícito do JSON
    addItem: function (productId) {
      if (cardapioCache.length === 0) {
        const paths = [
          "/json/cardapio.json",
          "../../json/cardapio.json",
          "../json/cardapio.json",
        ];
        for (let i = 0; i < paths.length; i++) {
          $.ajax({
            url: paths[i],
            async: false,
            dataType: "json",
            success: function (data) {
              cardapioCache = [];
              if (data.categorias) {
                data.categorias.forEach((cat) => {
                  cat.produtos.forEach((prod) => {
                    cardapioCache.push(prod);
                  });
                });
              }
            },
          });
          if (cardapioCache.length > 0) break;
        }
      }

      const produto = cardapioCache.find((p) => p.id === productId);
      if (!produto) {
        console.error(
          "Produto não encontrado no cardápio com o ID: " + productId,
        );
        return;
      }

      let cart = $.SaborCart.getCart();
      const index = cart.findIndex((item) => item.id === produto.id);

      let fotoPath = produto.foto.startsWith("/")
        ? produto.foto
        : "/" + produto.foto;

      if (index > -1) {
        cart[index].quantidade += 1;
      } else {
        cart.push({
          id: produto.id,
          nome: produto.nome,
          preco: Number(produto.preco),
          quantidade: 1,
          foto: fotoPath,
        });
      }

      $.SaborCart.saveCart(cart);

      // Notificação Toastr exibindo o nome do produto inserido
      if (typeof toastr !== "undefined") {
        var msgToast =
          "<b>" +
          produto.nome +
          "</b> está no seu carrinho.<br><br>" +
          "<a href='../../carrinho.html' style='color: #ffffff; background-color: #436541; padding: 6px 12px; border-radius: 4px; text-decoration: none; font-weight: bold; display: inline-block;'>Ver Carrinho &rarr;</a>";
        toastr.success(msgToast, "Adicionado ao carrinho");
      }
    },

    // Retorna o valor total do carrinho
    getTotal: function () {
      const cart = $.SaborCart.getCart();
      return cart.reduce(
        (total, item) => total + item.preco * item.quantidade,
        0,
      );
    },

    // Retorna a quantidade total de itens
    getTotalCount: function () {
      const cart = $.SaborCart.getCart();
      return cart.reduce((count, item) => count + item.quantidade, 0);
    },

    // Limpa o carrinho
    clear: function () {
      localStorage.removeItem(STORAGE_KEY);
      $.SaborCart.renderUI();
    },

    // Atualiza a interface gráfica (Badge e Carrinho Suspenso do Menu)
    renderUI: function () {
      const cart = $.SaborCart.getCart();
      const totalCount = $.SaborCart.getTotalCount();
      const subtotal = $.SaborCart.getTotal();

      // 1. Atualiza o contador (Badge) do topo
      $(".cart-count").text(totalCount);

      // 2. Reconstrói a lista HTML do carrinho suspenso (.shop-cart)
      const $shopCartList = $(".shop-cart");
      if ($shopCartList.length) {
        $shopCartList.empty();

        if (cart.length === 0) {
          $shopCartList.append(
            '<li class="cart-item"><div class="cart-content"><h5>Seu carrinho está vazio</h5></div></li>',
          );
        } else {
          cart.forEach((item) => {
            const itemHtml = `
              <li class="cart-item">
                <img src="${item.foto}" alt="${item.nome}" onerror="this.src='/images/logo_retangular.png'" />
                <div class="cart-content">
                  <h5>${item.nome}</h5>
                  <span class="cart-quantity"> ${item.quantidade} x R$ ${item.preco.toFixed(2).replace(".", ",")} </span>
                </div>
              </li>
            `;
            $shopCartList.append(itemHtml);
          });
        }
      }

      // 3. Atualiza o valor do Subtotal na interface
      $(".cart-total span").text("R$ " + subtotal.toFixed(2).replace(".", ","));
    },
  };

  // Inicialização automática ao carregar o DOM
  $(document).ready(function () {
    $.SaborCart.init();

    // Listener global blindado para os botões de adicionar ao carrinho
    $(document)
      .off("click", ".btn-comprar")
      .on("click", ".btn-comprar", function (e) {
        e.preventDefault();
        e.stopImmediatePropagation(); // Mata a propagação para evitar o redirecionamento do card pai
        e.stopPropagation();

        const $btn = $(this);
        if ($btn.data("processing")) return;
        $btn.data("processing", true);

        const idProduto = $btn.data("id");
        $.SaborCart.addItem(idProduto);

        setTimeout(function () {
          $btn.data("processing", false);
        }, 300);
      });

    // 1. Ao clicar no ícone, abre e fecha o carrinho
    $(document).on("click", ".shop-menu-cnt > a", function (e) {
      e.preventDefault();
      e.stopPropagation();

      var $cartMenu = $(this).siblings(".shop-menu");

      $cartMenu.toggleClass("is-active");

      if ($cartMenu.hasClass("is-active")) {
        $cartMenu.stop(true, true).fadeIn(150);
      } else {
        $cartMenu.stop(true, true).fadeOut(150, function () {
          $(this).attr("style", "");
        });
      }
    });

    // 2. Impede que clicar dentro do carrinho o feche
    $(document).on("click", ".shop-menu", function (e) {
      e.stopPropagation();
    });

    // 3. Fecha se clicar em qualquer lugar fora e reseta o hover
    $(document).on("click", function (e) {
      if (!$(e.target).closest(".shop-menu-cnt").length) {
        $(".shop-menu")
          .removeClass("is-active")
          .fadeOut(150, function () {
            $(this).attr("style", "");
          });
      }
    });
  });
})(jQuery);
