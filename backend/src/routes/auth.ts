import { Router, Request, Response } from "express";
import { getConfig } from "../config";
import { validateASN } from "../utils";
import { getOidcClient, generateState, validateState } from "../services/oauth";
import { generateToken } from "../middleware/auth";
import { getDatabase } from "../db";
import _ from "lodash";

const router = Router();

router.get("/providers", (_: Request, res: Response) => {
  const config = getConfig();
  const providers = config.oauth.map((p) => ({
    id: p.id,
    name: p.name,
  }));
  res.json(providers);
});

router.get("/login/:providerId", async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;
    const config = getConfig();
    const provider = config.oauth.find((p) => p.id === providerId);

    if (!provider) {
      res.status(404).json({ error: "Provider not found" });
      return;
    }

    const client = await getOidcClient(provider);
    const { state, codeChallenge } = generateState(providerId);
    const redirectUri = `${req.protocol}://${req.get("host")}/auth/callback/${providerId}`;

    const authUrl = client.authorizationUrl({
      scope: "openid profile email dn42",
      state,
      redirect_uri: redirectUri,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    res.redirect(authUrl);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to initiate login" });
  }
});

router.get("/callback/:providerId", async (req: Request, res: Response) => {
  const config = getConfig();
  const frontendUrl = config.server.frontendUrl;

  try {
    const { providerId } = req.params;
    const provider = config.oauth.find((p) => p.id === providerId);

    if (!provider) {
      res.redirect(`${frontendUrl}/auth/callback?error=Provider+not+found`);
      return;
    }

    const client = await getOidcClient(provider);
    const params = client.callbackParams(req);

    if (!params.state) {
      res.redirect(`${frontendUrl}/auth/callback?error=Missing+state`);
      return;
    }

    const storedData = validateState(params.state);
    if (!storedData || storedData.providerId !== providerId) {
      res.redirect(
        `${frontendUrl}/auth/callback?error=Invalid+or+expired+state`,
      );
      return;
    }

    const redirectUri = `${req.protocol}://${req.get("host")}/auth/callback/${providerId}`;

    const tokenSet = await client.callback(redirectUri, params, {
      state: params.state,
      code_verifier: storedData.codeVerifier,
    });
    if (!tokenSet.access_token) {
      res.redirect(
        `${frontendUrl}/auth/callback?error=Failed+to+retrieve+access+token`,
      );
      return;
    }

    const userInfo = await client.userinfo(tokenSet.access_token);
    const asn = String(_.get(userInfo, provider.asnJsonPath));

    if (!asn || !validateASN(asn as string)) {
      res.redirect(`${frontendUrl}/auth/callback?error=Invalid+ASN`);
      return;
    }

    const db = getDatabase();
    const existingUser = db
      .prepare("SELECT * FROM users WHERE asn = ?")
      .get(asn as string);

    if (!existingUser) {
      db.prepare("INSERT INTO users (asn) VALUES (?)").run(asn as string);
    }

    const token = generateToken(asn as string);

    // 修改这里：认证成功，携带着 token 重定向回前端页面！
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  } catch (error) {
    console.error("OAuth callback error:", error);
    res.redirect(`${frontendUrl}/auth/callback?error=Authentication+failed`);
  }
});

export default router;
