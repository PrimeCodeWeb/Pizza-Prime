const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const {
    MercadoPagoConfig,
    Payment
} = require("mercadopago");

require("dotenv").config();


// ==================================================
// CONFIGURAÇÃO DO SERVIDOR
// ==================================================

const app = express();

const PORT = 3000;


// Permite requisições do frontend
app.use(cors());

// Permite receber JSON
app.use(express.json());


// ==================================================
// SERVIR OS ARQUIVOS DO SITE
// ==================================================

// Permite acessar:
// index.html
// carrinho.html
// pagamento.html
// CSS
// JS
// imagens
// etc.

app.use(express.static(__dirname));


// ==================================================
// MERCADO PAGO
// ==================================================

if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {

    console.error(
        "ERRO: MERCADOPAGO_ACCESS_TOKEN não encontrado no .env"
    );

} else {

    console.log(
        "Access Token do Mercado Pago carregado."
    );

}


const client = new MercadoPagoConfig({

    accessToken:
        process.env.MERCADOPAGO_ACCESS_TOKEN

});


const payment = new Payment(client);


// ==================================================
// ROTA PRINCIPAL
// ==================================================

app.get("/", (req, res) => {

    res.sendFile(
        __dirname + "/index.html"
    );

});


// ==================================================
// TESTE DO SERVIDOR
// ==================================================

app.get("/teste", (req, res) => {

    res.json({

        sucesso: true,

        mensagem:
            "Servidor da Pizza Prime funcionando! 🍕"

    });

});


// ==================================================
// PROCESSAR PAGAMENTO
// ==================================================

app.post("/process_payment", async (req, res) => {

    console.log("\n==============================");
    console.log("NOVO PAGAMENTO RECEBIDO");
    console.log("==============================");

    try {

        const dados = req.body;


        console.log(
            "Método:",
            dados.payment_method_id
        );


        console.log(
            "Valor:",
            dados.transaction_amount
        );


        console.log(
            "Email:",
            dados.payer?.email
        );


        // ------------------------------------------
        // VALIDAÇÕES BÁSICAS
        // ------------------------------------------

        if (!dados.transaction_amount) {

            return res.status(400).json({

                error:
                    "Valor do pagamento não informado."

            });

        }


        if (!dados.payment_method_id) {

            return res.status(400).json({

                error:
                    "Método de pagamento não informado."

            });

        }


        if (!dados.payer?.email) {

            return res.status(400).json({

                error:
                    "E-mail do comprador não informado."

            });

        }


        // ------------------------------------------
        // DADOS DO PAGAMENTO
        // ------------------------------------------

        const pagamento = {

            transaction_amount:
                Number(dados.transaction_amount),

            description:
                dados.description ||
                "Pedido Pizza Prime",

            payment_method_id:
                dados.payment_method_id,

            payer: {

                email:
                    dados.payer.email

            }

        };


        // ------------------------------------------
        // CAMPOS DE CARTÃO
        // ------------------------------------------

        if (dados.token) {

            pagamento.token =
                dados.token;

        }


        if (dados.installments) {

            pagamento.installments =
                Number(dados.installments);

        }


        if (dados.issuer_id) {

            pagamento.issuer_id =
                Number(dados.issuer_id);

        }


        // ------------------------------------------
        // IDENTIFICAÇÃO
        // ------------------------------------------

        pagamento.external_reference =
            `PIZZA-${Date.now()}`;


        // ------------------------------------------
        // IDEMPOTÊNCIA
        // ------------------------------------------

        const idempotencyKey =
            crypto.randomUUID();


        console.log(
            "Enviando pagamento para o Mercado Pago..."
        );


        // ------------------------------------------
        // CRIAR PAGAMENTO
        // ------------------------------------------

        const resultado =
            await payment.create({

                body: pagamento,

                requestOptions: {

                    customHeaders: {

                        "X-Idempotency-Key":
                            idempotencyKey

                    }

                }

            });


        console.log(
            "Pagamento criado com sucesso!"
        );


        console.log(
            "ID:",
            resultado.id
        );


        console.log(
            "Status:",
            resultado.status
        );


        console.log(
            "Detalhes:",
            resultado.status_detail
        );


        console.log(
            "==============================\n"
        );


        // ------------------------------------------
        // DEVOLVE RESULTADO AO SITE
        // ------------------------------------------

        return res.status(200).json({

            success: true,

            id:
                resultado.id,

            status:
                resultado.status,

            status_detail:
                resultado.status_detail,

            payment_method_id:
                resultado.payment_method_id,

            payment_type_id:
                resultado.payment_type_id

        });


    } catch (error) {

        console.error(
            "\nERRO AO PROCESSAR PAGAMENTO:"
        );


        console.error(error);


        return res.status(500).json({

            success: false,

            error:
                "Não foi possível processar o pagamento.",

            details:
                error.message

        });

    }

});


// ==================================================
// INICIAR SERVIDOR
// ==================================================

app.listen(PORT, () => {

    console.log("");
    console.log("======================================");
    console.log("🍕 PIZZA PRIME");
    console.log("======================================");
    console.log(
        `Servidor: http://localhost:${PORT}`
    );
    console.log(
        `Site: http://localhost:${PORT}/index.html`
    );
    console.log(
        `Pagamento: http://localhost:${PORT}/pagamento.html`
    );
    console.log("======================================");
    console.log("");

});