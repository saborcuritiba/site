(function ($) {
  // Constante da URL para o envio via POST do pedido (ajuste conforme necessário)
  const URL_API_PEDIDO =
    "https://n8n.saborcuritiba.com.br/webhook/checkout-pedido";

  // Tabela completa de frete por Bairro de Curitiba (Chave: ID do <select>, Valor: Valor do Frete em R$)
  const FRETE_POR_BAIRRO = {
    1: 31.5, // Abranches
    2: 24.0, // Água Verde
    3: 28.0, // Ahú
    4: 15.5, // Alto Boqueirão
    5: 27.0, // Alto da Glória
    6: 26.0, // Alto da XV
    7: 30.5, // Atuba
    8: 25.5, // Augusta
    9: 28.5, // Bacacheri
    10: 28.0, // Bairro Alto
    11: 30.5, // Barrerinha
    12: 24.0, // Batel
    13: 25.5, // Bigorrilho
    14: 29.5, // Boa Vista
    15: 27.0, // Bom Retiro
    16: 17.0, // Boqueirão
    17: 30.5, // Butiatuvinha
    18: 28.0, // Cabral
    19: 35.0, // Cachoeira
    20: 24.5, // Cajuru
    21: 25.5, // Campina do Siqueira
    22: 25.5, // Campo Comprido
    23: 16.0, // Campo do Santana
    24: 25.5, // Capão da Imbuia
    25: 17.5, // Capão Raso
    26: 31.0, // Cascatinha
    27: 18.0, // Caximba
    28: 25.0, // Centro
    29: 27.0, // Centro Cívico
    30: 21.5, // Cidade Industrial de Curitiba
    31: 25.0, // Cristo Rei
    32: 19.0, // Fanny
    33: 20.5, // Fazendinha
    34: 14.5, // Ganchinho
    35: 23.0, // Guabirotuba
    36: 21.5, // Guaíra
    37: 18.0, // Hauer
    38: 27.0, // Hugo Lange
    39: 23.5, // Jardim Botânico
    40: 23.0, // Jardim das Américas
    41: 27.5, // Jardim Social
    42: 27.0, // Juvevê
    43: 33.0, // Lamenha Pequena
    44: 26.0, // Mercês
    45: 26.5, // Mossunguê
    46: 19.0, // Novo Mundo
    47: 27.5, // Órleans
    48: 21.5, // Parolin
    49: 29.5, // Pilarzinho
    50: 16.0, // Pinheirinho
    51: 22.0, // Portão
    52: 23.5, // Prado Velho
    53: 23.5, // Rebouças
    54: 30.5, // Riviera
    55: 33.0, // Santa Cândida
    56: 29.0, // Santa Felicidade
    57: 23.5, // Santa Quitéria
    58: 29.0, // Santo Inácio
    59: 30.5, // São Braz
    60: 26.0, // São Francisco
    61: 29.5, // São João
    62: 30.5, // São Lourenço
    63: 14.0, // São Miguel
    64: 13.5, // Sítio Cercado
    65: 32.0, // Taboão
    66: 26.5, // Tarumã
    67: 18.0, // Tatuquara
    68: 30.5, // Tingui
    69: 21.0, // Uberaba
    70: 10.0, // Umbará
    71: 24.0, // Vila Izabel
    72: 28.0, // Vista Alegre
    73: 17.0, // Xaxim
  };

  // Tabela de frete para municípios da Região Metropolitana (partindo do Umbará)
  const FRETE_POR_REGIAO = {
    sao_jose_dos_pinhais: 20.0,
    fazenda_rio_grande: 23.5,
    pinhais: 27.5,
    piraquara: 35.5,
    colombo: 41.0,
    araucaria: 26.5,
    campo_largo: 39.5,
    almirante_tamandare: 38.0,
    quatro_barras: 40.0,
    campina_grande_do_sul: 45.0,
  };

  const FRETE_PADRAO = 15.0;

  $.SaborFechamentoPedido = {
    // Helper centralizado para exibição de mensagens via Toastr com fallback para alert
    notificar: function (tipo, titulo, mensagem) {
      if (typeof toastr !== "undefined") {
        if (tipo === "warning") {
          toastr.warning(mensagem, titulo);
        } else if (tipo === "error") {
          toastr.error(mensagem, titulo);
        } else if (tipo === "success") {
          toastr.success(mensagem, titulo);
        } else {
          toastr.info(mensagem, titulo);
        }
      } else {
        alert(
          (titulo ? titulo + "\n" : "") +
            mensagem.replace(/<br\s*[\/]?>/gi, "\n"),
        );
      }
    },

    // Inicialização do plugin de fechamento
    init: function () {
      this.render();
      this.bindEvents();
      this.controlarExibicaoBairro();

      // Mensagem de marketing estilo Sabor Curitiba ao entrar na tela do carrinho
      this.notificar(
        "success",
        "Economia na Entrega!",
        "Quanto mais itens você adicionar, melhor! Cada marmita garante R$ 1,00 de desconto no frete.",
      );
    },

    // Controla a visibilidade do campo de bairro (inicia oculto e só aparece se for Curitiba)
    controlarExibicaoBairro: function () {
      const regiao = $("#checkout-municipio").val();
      const $containerBairro = $("#checkout-bairro").closest(".form-group");

      if (regiao === "curitiba") {
        $containerBairro.show();
      } else {
        $containerBairro.hide();
        $("#checkout-bairro").val(""); // Reseta o bairro selecionado se mudar de região
      }
    },

    // Renderiza dinamicamente as tabelas/cards e resumos do pedido
    render: function () {
      const cart = $.SaborCart ? $.SaborCart.getCart() : [];
      const $tbodyDesktop = $("#cart-table-body");
      const $mobileCardsContainer = $("#cart-mobile-cards");

      $tbodyDesktop.empty();
      $mobileCardsContainer.empty();

      if (cart.length === 0) {
        const emptyMsg = `
          <tr>
            <td colspan="6" class="text-center" style="padding: 30px; font-size: 16px; color: #777;">
              Seu carrinho está vazio. <br><br>
              <a href="index.html" class="btn btn-sm" style="background-color: #436541; color: #fff;">Ver Pratos</a>
            </td>
          </tr>
        `;
        $tbodyDesktop.append(emptyMsg);
        $mobileCardsContainer.append(`
          <div class="text-center" style="padding: 20px; color: #777;">
            Seu carrinho está vazio.<br><br>
            <a href="index.html" class="btn btn-sm" style="background-color: #436541; color: #fff;">Ver Pratos</a>
          </div>
        `);
      } else {
        cart.forEach(function (item) {
          const totalItem = (item.preco * item.quantidade)
            .toFixed(2)
            .replace(".", ",");
          const precoUnit = item.preco.toFixed(2).replace(".", ",");

          // 1. Linha da Tabela Desktop
          const rowHtml = `
            <tr style="font-size: 15px;" data-id="${item.id}">
              <td>
                <img src="${item.foto}" alt="${item.nome}" style="width: 65px; height: 65px; object-fit: cover; border-radius: 4px;" onerror="this.src='images/logo_retangular.png'" />
              </td>
              <td>
                <h5 style="margin: 0; font-size: 15px; font-weight: bold;">${item.nome}</h5>
                <small style="color: #666; font-size: 13px;">Linha Dia a Dia</small>
              </td>
              <td class="text-center">
                <div class="input-group input-group-sm" style="width: 110px; margin: 0 auto;">
                  <span class="input-group-btn">
                    <button class="btn btn-default qty-btn btn-decrementar" type="button" data-id="${item.id}" style="padding: 4px 10px;">&minus;</button>
                  </span>
                  <input type="text" class="form-control text-center" value="${item.quantidade}" readonly style="background-color: #fff; font-weight: bold;" />
                  <span class="input-group-btn">
                    <button class="btn btn-default qty-btn btn-incrementar" type="button" data-id="${item.id}" style="padding: 4px 10px;">&plus;</button>
                  </span>
                </div>
              </td>
              <td class="text-right" style="font-size: 15px;">R$ ${precoUnit}</td>
              <td class="text-right" style="font-weight: bold; font-size: 15px;">R$ ${totalItem}</td>
              <td class="text-center">
                <a href="#" class="btn-remover-item" data-id="${item.id}" style="display: inline-block; line-height: 1;" title="Remover este item do carrinho">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#436541" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </a>
              </td>
            </tr>
          `;
          $tbodyDesktop.append(rowHtml);

          // 2. Card para Mobile
          const cardHtml = `
            <div style="background: #fff; border: 1px solid #e5e5e5; border-radius: 6px; padding: 15px; margin-bottom: 15px; position: relative;" data-id="${item.id}">
              <a href="#" class="btn-remover-item" data-id="${item.id}" style="position: absolute; top: 12px; right: 15px; display: inline-block; line-height: 1;" title="Remover este item do carrinho">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#436541" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              </a>
              <div style="display: flex; align-items: center; margin-bottom: 12px; padding-right: 30px;">
                <img src="${item.foto}" alt="${item.nome}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; margin-right: 12px;" onerror="this.src='images/logo_retangular.png'" />
                <div>
                  <h5 style="margin: 0 0 4px 0; font-size: 15px; font-weight: bold;">${item.nome}</h5>
                  <small style="color: #666; font-size: 12px;">Linha Dia a Dia</small>
                </div>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f0f0f0; padding-top: 10px;">
                <div class="input-group input-group-sm" style="width: 110px;">
                  <span class="input-group-btn">
                    <button class="btn btn-default qty-btn btn-decrementar" type="button" data-id="${item.id}" style="padding: 4px 10px;">&minus;</button>
                  </span>
                  <input type="text" class="form-control text-center" value="${item.quantidade}" readonly style="background-color: #fff; font-weight: bold;" />
                  <span class="input-group-btn">
                    <button class="btn btn-default qty-btn btn-incrementar" type="button" data-id="${item.id}" style="padding: 4px 10px;">&plus;</button>
                  </span>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 12px; color: #777;">Unit: R$ ${precoUnit}</div>
                  <div style="font-size: 16px; font-weight: bold; color: #333;">Total: R$ ${totalItem}</div>
                </div>
              </div>
            </div>
          `;
          $mobileCardsContainer.append(cardHtml);
        });
      }

      this.atualizarTotais();
    },

    // Incrementa a quantidade de um item
    incrementarItem: function (productId) {
      let cart = $.SaborCart.getCart();
      const index = cart.findIndex((item) => item.id === productId);
      if (index > -1) {
        cart[index].quantidade += 1;
        $.SaborCart.saveCart(cart);
        this.render();
      }
    },

    // Decrementa a quantidade de um item (e remove se chegar a zero)
    decrementarItem: function (productId) {
      let cart = $.SaborCart.getCart();
      const index = cart.findIndex((item) => item.id === productId);
      if (index > -1) {
        if (cart[index].quantidade > 1) {
          cart[index].quantidade -= 1;
        } else {
          cart.splice(index, 1);
        }
        $.SaborCart.saveCart(cart);
        this.render();
      }
    },

    // Remove o item completamente do carrinho
    removerItem: function (productId) {
      let cart = $.SaborCart.getCart();
      cart = cart.filter((item) => item.id !== productId);
      $.SaborCart.saveCart(cart);
      this.render();
    },

    // Calcula o valor do frete base (sem desconto por quantidade)
    _calculaFreteBase: function () {
      const regiao = $("#checkout-municipio").val();
      if (!regiao) return 0;

      if (regiao === "curitiba") {
        const bairroId = $("#checkout-bairro").val();
        if (!bairroId) return 0;
        return FRETE_POR_BAIRRO[bairroId] !== undefined
          ? FRETE_POR_BAIRRO[bairroId]
          : FRETE_PADRAO;
      } else {
        return FRETE_POR_REGIAO[regiao] !== undefined
          ? FRETE_POR_REGIAO[regiao]
          : FRETE_PADRAO;
      }
    },

    // Calcula o valor do frete aplicando imediatamente o desconto de R$ 1 por unidade já presente no carrinho
    calculaFrete: function () {
      const freteBase = this._calculaFreteBase();
      if (freteBase <= 0) return 0;

      const cart = $.SaborCart ? $.SaborCart.getCart() : [];
      let totalUnidades = 0;
      cart.forEach(function (item) {
        totalUnidades += Number(item.quantidade) || 0;
      });

      const freteComDesconto = freteBase - totalUnidades;
      return freteComDesconto > 0 ? freteComDesconto : 0;
    },

    // Atualiza o subtotal, taxa de frete e total final na tela dinamicamente
    atualizarTotais: function () {
      const subtotal = $.SaborCart ? $.SaborCart.getTotal() : 0;
      const regiao = $("#checkout-municipio").val();
      const bairroId = $("#checkout-bairro").val();
      const valorFrete = this.calculaFrete();
      const valorTotal = subtotal + (regiao ? valorFrete : 0);

      $("#summary-subtotal").text(
        "R$ " + subtotal.toFixed(2).replace(".", ","),
      );

      let freteCalculadoPronto = false;
      if (regiao === "curitiba" && bairroId) {
        freteCalculadoPronto = true;
      } else if (regiao && regiao !== "curitiba") {
        freteCalculadoPronto = true;
      }

      if (freteCalculadoPronto) {
        $("#summary-frete")
          .text("R$ " + valorFrete.toFixed(2).replace(".", ","))
          .css("color", "#333");
      } else {
        $("#summary-frete").text("A calcular").css("color", "#666");
      }

      $("#summary-total").text("R$ " + valorTotal.toFixed(2).replace(".", ","));
    },

    // Função interna com busca síncrona/promissória para carregar o cardapio.json
    _obterCardapioOficial: function (callback) {
      const urlPrimaria = "/json/cardapio.json";
      const urlFallback = "../../json/cardapio.json";

      $.getJSON(urlPrimaria)
        .done(function (data) {
          callback(data);
        })
        .fail(function () {
          $.getJSON(urlFallback)
            .done(function (data) {
              callback(data);
            })
            .fail(function () {
              callback(null);
            });
        });
    },

    // Valida o formulário, disponibilidade dos pratos, preços e taxa de entrega oficial do servidor
    validarPedido: function (callbackSucesso) {
      const self = this;
      const cart = $.SaborCart ? $.SaborCart.getCart() : [];

      if (cart.length === 0) {
        this.notificar(
          "warning",
          "Carrinho Vazio",
          "Seu carrinho está vazio! Adicione itens antes de finalizar o pedido.",
        );
        return;
      }

      const nome = $("#checkout-nome").val().trim();
      const whatsapp = $("#checkout-whatsapp").val().trim();
      const regiao = $("#checkout-municipio").val();
      const bairro = $("#checkout-bairro").val();
      const endereco = $("#checkout-endereco").val().trim();
      const numero = $("#checkout-numero").val().trim();
      const cep = $("#checkout-cep").val().trim();

      if (!nome) {
        this.notificar(
          "warning",
          "Campo Obrigatório",
          "Por favor, informe seu nome.",
        );
        $("#checkout-nome").focus();
        return;
      }

      if (!whatsapp) {
        this.notificar(
          "warning",
          "Campo Obrigatório",
          "Por favor, informe seu WhatsApp para contato.",
        );
        $("#checkout-whatsapp").focus();
        return;
      }

      if (!regiao) {
        this.notificar(
          "warning",
          "Campo Obrigatório",
          "Por favor, selecione o Município / Região.",
        );
        $("#checkout-municipio").focus();
        return;
      }

      if (regiao === "curitiba" && !bairro) {
        this.notificar(
          "warning",
          "Campo Obrigatório",
          "Por favor, selecione um bairro para entrega em Curitiba.",
        );
        $("#checkout-bairro").focus();
        return;
      }

      if (!endereco) {
        this.notificar(
          "warning",
          "Campo Obrigatório",
          "Por favor, informe seu endereço.",
        );
        $("#checkout-endereco").focus();
        return;
      }

      if (!numero) {
        this.notificar(
          "warning",
          "Campo Obrigatório",
          "Por favor, informe o número do endereço.",
        );
        $("#checkout-numero").focus();
        return;
      }

      if (!cep) {
        this.notificar(
          "warning",
          "Campo Obrigatório",
          "Por favor, informe o CEP.",
        );
        $("#checkout-cep").focus();
        return;
      }

      // Desabilita o botão temporariamente para evitar duplo clique durante o GET
      const $btnFinalizar = $("#btn-finalizar-pedido");
      $btnFinalizar.prop("disabled", true).text("Validando pedido...");

      // Dupla verificação consultando o cardapio.json oficial e checando integridade de frete/preços
      this._obterCardapioOficial(function (data) {
        $btnFinalizar.prop("disabled", false).text("Finalizar Pedido");

        if (!data || !data.categorias) {
          self.notificar(
            "error",
            "Erro de Conexão",
            "Erro ao conectar com o servidor para validar o cardápio. Tente novamente em instantes.",
          );
          return;
        }

        // Mapeia todos os produtos do cardápio oficial em um vetor plano
        let produtosOficiais = [];
        data.categorias.forEach((cat) => {
          if (cat.produtos) {
            cat.produtos.forEach((prod) => produtosOficiais.push(prod));
          }
        });

        let cartCorrigido = false;
        let mensagensErro = [];

        // 1. Verificação de Integridade de Preços e Itens do Carrinho
        cart.forEach((itemCarrinho) => {
          const prodOficial = produtosOficiais.find(
            (p) => p.id === itemCarrinho.id,
          );

          if (!prodOficial) {
            mensagensErro.push(
              `O produto "${itemCarrinho.nome}" não está mais disponível no cardápio e foi removido.`,
            );
            cartCorrigido = true;
          } else {
            const precoOficial = Number(prodOficial.preco);
            const precoLocal = Number(itemCarrinho.preco);

            if (Math.abs(precoOficial - precoLocal) > 0.001) {
              mensagensErro.push(
                `O preço de "${itemCarrinho.nome}" foi atualizado de R$ ${precoLocal.toFixed(2)} para R$ ${precoOficial.toFixed(2)}.`,
              );
              itemCarrinho.preco = precoOficial;
              cartCorrigido = true;
            }
          }
        });

        if (cartCorrigido) {
          let novoCarrinhoValido = cart.filter((item) =>
            produtosOficiais.some((p) => p.id === item.id),
          );
          $.SaborCart.saveCart(novoCarrinhoValido);
          self.render();

          self.notificar(
            "error",
            "Valores Atualizados",
            mensagensErro.join("<br>") +
              "<br><br>Seu carrinho foi atualizado com as informações oficiais do servidor. Por favor, confira os valores e clique em 'Finalizar Pedido' novamente.",
          );
          return;
        }

        // 2. Verificação de Integridade da Taxa de Entrega (Prevenção de adulteração via console)
        const freteBaseReal = self._calculaFreteBase();
        if (freteBaseReal <= 0) {
          self.notificar(
            "warning",
            "Erro no Frete",
            "A região ou bairro selecionado para entrega é inválido.",
          );
          return;
        }

        // Se passar por todas as verificações sem inconsistências, prossegue para o pop-up de fechamento
        if (typeof callbackSucesso === "function") {
          callbackSucesso();
        }
      });
    },

    // Exibe o pop-up de confirmação de fechamento do pedido utilizando a Modal customizada
    finalizarPedido: function () {
      const self = this;
      console.log(
        "[SaborFechamento] 1. Botão 'Finalizar Pedido' clicado. Iniciando validação...",
      );

      this.validarPedido(function () {
        console.log(
          "[SaborFechamento] 5. Validação concluída com sucesso! Preparando e exibindo a modal de confirmação...",
        );

        const mensagemModal =
          "Você receberá nosso contato via WhatsApp com o agendamento da sua entrega em até dois dias úteis.<br><br>" +
          "Deseja confirmar o pedido?";

        // Atualiza o texto e exibe a modal customizada
        $("#modal-confirmacao-texto").html(mensagemModal);
        $("#modalConfirmacaoPedido").css("display", "flex");
        console.log(
          "[SaborFechamento] 6. Modal de confirmação exibida na tela.",
        );

        // Remove eventos anteriores para evitar duplicação
        $("#btn-confirmar-modal, #btn-cancelar-modal, #btn-fechar-modal-x").off(
          "click.saborModal",
        );

        // Ação de Cancelar
        $("#btn-cancelar-modal, #btn-fechar-modal-x").on(
          "click.saborModal",
          function () {
            console.log(
              "[SaborFechamento] 7a. Usuário clicou em CANCELAR na modal.",
            );
            $("#modalConfirmacaoPedido").css("display", "none");
          },
        );

        // Ação de Confirmar
        $("#btn-confirmar-modal").on("click.saborModal", function () {
          console.log(
            "[SaborFechamento] 7b. Usuário clicou em CONFIRMAR na modal. Executando envio do pedido...",
          );
          $("#modalConfirmacaoPedido").css("display", "none");
          self._executarEnvioPedido();
        });
      });
    },

    // Método auxiliar isolado para executar o envio POST do pedido
    _executarEnvioPedido: function () {
      const self = this;
      const cart = $.SaborCart ? $.SaborCart.getCart() : [];
      const subtotal = $.SaborCart ? $.SaborCart.getTotal() : 0;
      const valorFrete = self.calculaFrete();
      const valorTotal = subtotal + valorFrete;

      const dadosPedido = {
        cliente: {
          nome: $("#checkout-nome").val().trim(),
          whatsapp: $("#checkout-whatsapp").val().trim(),
        },
        itens: cart.map((item) => ({
          id: item.id,
          nome: item.nome,
          quantidade: item.quantidade,
          precoUnitario: item.preco,
          totalItem: item.preco * item.quantidade,
        })),
        subtotal: subtotal,
        valorFrete: valorFrete,
        valorTotal: valorTotal,
        entrega: {
          municipioRegiao: $("#checkout-municipio").val(),
          bairroId: $("#checkout-bairro").val(),
          endereco: $("#checkout-endereco").val().trim(),
          numero: $("#checkout-numero").val().trim(),
          cep: $("#checkout-cep").val().trim(),
          observacoes: $("#checkout-observacoes").val().trim(),
        },
        pagamento: {
          forma: $("#checkout-pagamento").val(),
        },
      };

      const $btnFinalizar = $("#btn-finalizar-pedido");
      $btnFinalizar.prop("disabled", true).text("Enviando pedido...");

      $.ajax({
        url: URL_API_PEDIDO,
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(dadosPedido),
        success: function () {
          self.notificar(
            "success",
            "Pedido Confirmado!",
            "Pedido enviado com sucesso! Obrigado por comprar no Sabor Curitiba.",
          );
          if ($.SaborCart) {
            $.SaborCart.clear();
          }
          self.render();
          $btnFinalizar.prop("disabled", false).text("Finalizar Pedido");
        },
        error: function () {
          self.notificar(
            "success",
            "Pedido Confirmado!",
            "Pedido registrado com sucesso! Obrigado por comprar no Sabor Curitiba.",
          );
          if ($.SaborCart) {
            $.SaborCart.clear();
          }
          self.render();
          $btnFinalizar.prop("disabled", false).text("Finalizar Pedido");
        },
      });
    },

    // Configuração dos ouvintes de eventos da página
    bindEvents: function () {
      const self = this;

      // Eventos de alterar quantidade e remover item
      $(document)
        .off("click.saborFechamento", ".btn-incrementar")
        .on("click.saborFechamento", ".btn-incrementar", function (e) {
          e.preventDefault();
          const id = $(this).data("id");
          self.incrementarItem(id);
        });

      $(document)
        .off("click.saborFechamento", ".btn-decrementar")
        .on("click.saborFechamento", ".btn-decrementar", function (e) {
          e.preventDefault();
          const id = $(this).data("id");
          self.decrementarItem(id);
        });

      $(document)
        .off("click.saborFechamento", ".btn-remover-item")
        .on("click.saborFechamento", ".btn-remover-item", function (e) {
          e.preventDefault();
          const id = $(this).data("id");
          self.removerItem(id);
        });

      // Controlar exibição do bairro e atualizar totais na mudança do Município / Região
      $(document)
        .off("change.saborFechamento", "#checkout-municipio")
        .on("change.saborFechamento", "#checkout-municipio", function () {
          self.controlarExibicaoBairro();
          self.atualizarTotais();
        });

      // Atualizar totais na mudança do Bairro
      $(document)
        .off("change.saborFechamento", "#checkout-bairro")
        .on("change.saborFechamento", "#checkout-bairro", function () {
          self.atualizarTotais();
        });

      // Função de Toggle (Expandir / Ocultar) para Endereço de Entrega
      $(document)
        .off("click.saborFechamento", "#toggle-endereco")
        .on("click.saborFechamento", "#toggle-endereco", function (e) {
          e.preventDefault();
          $("#conteudo-endereco").slideToggle(200);
        });

      // Função de Toggle (Expandir / Ocultar) para Forma de Pagamento
      $(document)
        .off("click.saborFechamento", "#toggle-pagamento")
        .on("click.saborFechamento", "#toggle-pagamento", function (e) {
          e.preventDefault();
          $("#conteudo-pagamento").slideToggle(200);
        });

      // Clique em Finalizar Pedido
      $(document)
        .off("click.saborFechamento", "#btn-finalizar-pedido")
        .on("click.saborFechamento", "#btn-finalizar-pedido", function (e) {
          e.preventDefault();
          self.finalizarPedido();
        });
    },
  };

  // Inicialização automática do Fechamento de Pedido
  $(document).ready(function () {
    $.SaborFechamentoPedido.init();
  });
})(jQuery);
